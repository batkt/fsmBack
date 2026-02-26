import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const userStatus = new Map<string, string>(); // userId -> status
  const socketToUser = new Map<string, string>(); // socketId -> userId

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("user_online", (data: { userId: string, status?: string }) => {
      const status = data.status || "online";
      userStatus.set(data.userId, status);
      socketToUser.set(socket.id, data.userId);
      
      socket.emit("online_users", Array.from(userStatus.entries()));

      io.emit("user_status_changed", { userId: data.userId, status });
      console.log(`User ${data.userId} is now ${status}`);
    });

    socket.on("change_status", (data: { status: string }) => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        userStatus.set(userId, data.status);
        io.emit("user_status_changed", { userId, status: data.status });
        console.log(`User ${userId} changed status to ${data.status}`);
      }
    });

    socket.on("join_room", (roomData: { projectId: string; taskId?: string }) => {
      const room = roomData.taskId ? `task_${roomData.taskId}` : `project_${roomData.projectId}`;
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on("leave_room", (roomData: { projectId: string; taskId?: string }) => {
      const room = roomData.taskId ? `task_${roomData.taskId}` : `project_${roomData.projectId}`;
      socket.leave(room);
      console.log(`User ${socket.id} left room: ${room}`);
    });

    socket.on("disconnect", () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        userStatus.set(userId, "offline");
        io.emit("user_status_changed", { userId, status: "offline" });
        socketToUser.delete(socket.id);
      }
      console.log("A user disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const emitToRoom = (room: string, event: string, data: any) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};
