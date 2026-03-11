import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketServer;
let isInitialized = false;

export const initSocket = (server: HttpServer) => {
  try {
    io = new SocketServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    isInitialized = true;
    console.log("[Socket.IO] ✅ Socket.IO initialized successfully");
    console.log("[Socket.IO] Server ready to accept connections");

    const userStatus = new Map<string, string>(); // userId -> status
    const socketToUser = new Map<string, string>(); // socketId -> userId
    const roomUsers = new Map<string, Set<string>>(); // room -> Set of socketIds

    io.on("connection", (socket) => {
      console.log("[Socket.IO] 🔌 New connection:", {
        socketId: socket.id,
        transport: socket.conn.transport.name,
        timestamp: new Date().toISOString()
      });

    socket.on("user_online", (data: { userId: string, status?: string }) => {
      try {
        const status = data.status || "online";
        userStatus.set(data.userId, status);
        socketToUser.set(socket.id, data.userId);
        
        const onlineUsersList = Array.from(userStatus.entries());
        socket.emit("online_users", onlineUsersList);

        io.emit("user_status_changed", { userId: data.userId, status });
        
        console.log("[Socket.IO] 👤 User online:", {
          userId: data.userId,
          status: status,
          socketId: socket.id,
          totalOnlineUsers: userStatus.size
        });
      } catch (error) {
        console.error("[Socket.IO] ❌ Error in user_online event:", error);
      }
    });

    socket.on("change_status", (data: { status: string }) => {
      try {
        const userId = socketToUser.get(socket.id);
        if (userId) {
          userStatus.set(userId, data.status);
          io.emit("user_status_changed", { userId, status: data.status });
          console.log("[Socket.IO] 🔄 Status changed:", {
            userId: userId,
            newStatus: data.status,
            socketId: socket.id
          });
        } else {
          console.warn("[Socket.IO] ⚠️ change_status: User not found for socket", socket.id);
        }
      } catch (error) {
        console.error("[Socket.IO] ❌ Error in change_status event:", error);
      }
    });

    socket.on("join_room", (roomData: { projectId: string; taskId?: string }) => {
      try {
        const room = roomData.taskId ? `task_${roomData.taskId}` : `project_${roomData.projectId}`;
        socket.join(room);
        
        // Track room users
        if (!roomUsers.has(room)) {
          roomUsers.set(room, new Set());
        }
        roomUsers.get(room)!.add(socket.id);
        
        const roomSize = roomUsers.get(room)!.size;
        console.log("[Socket.IO] 🚪 Joined room:", {
          socketId: socket.id,
          room: room,
          roomType: roomData.taskId ? "task" : "project",
          usersInRoom: roomSize
        });
      } catch (error) {
        console.error("[Socket.IO] ❌ Error in join_room event:", error);
      }
    });

    // Join user-specific notification room
    socket.on("join_notifications", (data: { userId: string }) => {
      try {
        const room = `user_${data.userId}`;
        socket.join(room);
        
        // Track room users
        if (!roomUsers.has(room)) {
          roomUsers.set(room, new Set());
        }
        roomUsers.get(room)!.add(socket.id);
        
        const roomSize = roomUsers.get(room)!.size;
        console.log("[Socket.IO] 🔔 Joined notification room:", {
          socketId: socket.id,
          userId: data.userId,
          room: room,
          usersInRoom: roomSize
        });
      } catch (error) {
        console.error("[Socket.IO] ❌ Error in join_notifications event:", error);
      }
    });

    socket.on("join_barilga", (data: { barilgiinId: string }) => {
      try {
        const room = `barilga_${data.barilgiinId}`;
        socket.join(room);
        console.log(`[Socket.IO] Joined barilga room: ${room}`);
      } catch (error) {
        console.error("[Socket.IO] Error in join_barilga:", error);
      }
    });

    socket.on("leave_room", (roomData: { projectId: string; taskId?: string }) => {
      try {
        const room = roomData.taskId ? `task_${roomData.taskId}` : `project_${roomData.projectId}`;
        socket.leave(room);
        
        // Remove from tracking
        if (roomUsers.has(room)) {
          roomUsers.get(room)!.delete(socket.id);
          if (roomUsers.get(room)!.size === 0) {
            roomUsers.delete(room);
          }
        }
        
        console.log("[Socket.IO] 🚪 Left room:", {
          socketId: socket.id,
          room: room,
          remainingUsers: roomUsers.get(room)?.size || 0
        });
      } catch (error) {
        console.error("[Socket.IO] ❌ Error in leave_room event:", error);
      }
    });

    socket.on("disconnect", (reason: string) => {
      try {
        const userId = socketToUser.get(socket.id);
        if (userId) {
          userStatus.set(userId, "offline");
          io.emit("user_status_changed", { userId, status: "offline" });
          socketToUser.delete(socket.id);
        }
        
        // Remove from all rooms
        roomUsers.forEach((users, room) => {
          if (users.has(socket.id)) {
            users.delete(socket.id);
            if (users.size === 0) {
              roomUsers.delete(room);
            }
          }
        });
        
        console.log("[Socket.IO] 🔌 Disconnected:", {
          socketId: socket.id,
          userId: userId || "unknown",
          reason: reason,
          totalOnlineUsers: userStatus.size,
          activeRooms: roomUsers.size
        });
      } catch (error) {
        console.error("[Socket.IO] ❌ Error in disconnect event:", error);
      }
    });

    socket.on("error", (error: Error) => {
      console.error("[Socket.IO] ❌ Socket error:", {
        socketId: socket.id,
        error: error.message,
        stack: error.stack
      });
    });
  });

    // Log socket.io server status periodically
    setInterval(() => {
      if (io) {
        const sockets = io.sockets.sockets;
        const connectedCount = sockets.size;
        console.log("[Socket.IO] 📊 Status:", {
          connected: connectedCount,
          activeRooms: roomUsers.size,
          onlineUsers: userStatus.size,
          timestamp: new Date().toISOString()
        });
      }
    }, 60000); // Log every minute

    return io;
  } catch (error) {
    console.error("[Socket.IO] ❌ Failed to initialize Socket.IO:", error);
    isInitialized = false;
    throw error;
  }
};

export const getIO = () => {
  if (!io) {
    console.error("[Socket.IO] ❌ Socket.io not initialized!");
    throw new Error("Socket.io not initialized!");
  }
  if (!isInitialized) {
    console.warn("[Socket.IO] ⚠️ Socket.io initialized but not ready");
  }
  return io;
};

export const emitToRoom = (room: string, event: string, data: any) => {
  try {
    if (!io) {
      console.error("[Socket.IO] ❌ Cannot emit: Socket.io not initialized", {
        room: room,
        event: event
      });
      return;
    }

    if (!isInitialized) {
      console.warn("[Socket.IO] ⚠️ Socket.io not fully initialized, but attempting emit", {
        room: room,
        event: event
      });
    }

    const roomSockets = io.sockets.adapter.rooms.get(room);
    const roomSize = roomSockets ? roomSockets.size : 0;

    io.to(room).emit(event, data);

    console.log("[Socket.IO] 📤 Emitted to room:", {
      room: room,
      event: event,
      recipients: roomSize,
      hasData: !!data,
      dataType: data ? (data.constructor?.name || typeof data) : "null",
      timestamp: new Date().toISOString()
    });

    if (roomSize === 0) {
      console.warn("[Socket.IO] ⚠️ No users in room, event emitted but no recipients:", {
        room: room,
        event: event
      });
    }
  } catch (error) {
    console.error("[Socket.IO] ❌ Error emitting to room:", {
      room: room,
      event: event,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};
