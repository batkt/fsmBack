# Socket.IO API Documentation

This document describes the WebSocket/Socket.IO API for real-time communication in the FSM application.

## 🔌 Connection

**URL:** `http://localhost:8000` (or your server URL)  
**Protocol:** Socket.IO v4  
**CORS:** Enabled for all origins

### Basic Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
  transports: ["websocket", "polling"]
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});
```

---

## 📤 Client Events (Emit to Server)

### 1. Set User Online Status

Set the user's online status when they connect.

**Event:** `user_online`  
**Data:**
```json
{
  "userId": "695c57521a8a4aebc1d65b05",
  "status": "online"  // Optional: "online", "away", "dnd", "offline"
}
```

**Example:**
```javascript
socket.emit("user_online", {
  userId: "695c57521a8a4aebc1d65b05",
  status: "online"
});
```

**Response:** Server emits `online_users` with list of all online users.

---

### 2. Change User Status

Update the user's status (away, do not disturb, etc.).

**Event:** `change_status`  
**Data:**
```json
{
  "status": "away"  // "online", "away", "dnd", "offline"
}
```

**Example:**
```javascript
socket.emit("change_status", { status: "away" });
```

---

### 3. Join Room

Join a project or task room to receive real-time updates.

**Event:** `join_room`  
**Data:**
```json
{
  "projectId": "69a52aa0cfb03e9a3d5cff75",  // Required
  "taskId": "69a28bd791593791d03b06df"      // Optional: Only if joining task room
}
```

**Example:**
```javascript
// Join project room
socket.emit("join_room", {
  projectId: "69a52aa0cfb03e9a3d5cff75"
});

// Join task room (automatically joins project room too)
socket.emit("join_room", {
  projectId: "69a52aa0cfb03e9a3d5cff75",
  taskId: "69a28bd791593791d03b06df"
});
```

**Rooms:**
- `project_{projectId}` - Receives project-level events
- `task_{taskId}` - Receives task-specific events

---

### 4. Join Notification Room

Join user-specific notification room to receive personal notifications.

**Event:** `join_notifications`  
**Data:**
```json
{
  "userId": "695c57521a8a4aebc1d65b05"
}
```

**Example:**
```javascript
socket.emit("join_notifications", {
  userId: "695c57521a8a4aebc1d65b05"
});
```

**Room:** `user_{userId}` - Receives notifications for this user

---

### 5. Leave Room

Leave a project or task room.

**Event:** `leave_room`  
**Data:**
```json
{
  "projectId": "69a52aa0cfb03e9a3d5cff75",
  "taskId": "69a28bd791593791d03b06df"  // Optional
}
```

**Example:**
```javascript
socket.emit("leave_room", {
  projectId: "69a52aa0cfb03e9a3d5cff75",
  taskId: "69a28bd791593791d03b06df"
});
```

---

## 📥 Server Events (Listen from Server)

### 1. Online Users List

Received when you emit `user_online`. Contains list of all online users.

**Event:** `online_users`  
**Payload:**
```json
[
  ["695c57521a8a4aebc1d65b05", "online"],
  ["695c57521a8a4aebc1d65b06", "away"],
  ["695c57521a8a4aebc1d65b07", "dnd"]
]
```

**Example:**
```javascript
socket.on("online_users", (users) => {
  console.log("Online users:", users);
  // users is an array of [userId, status] pairs
});
```

---

### 2. User Status Changed

Emitted when any user changes their status.

**Event:** `user_status_changed`  
**Payload:**
```json
{
  "userId": "695c57521a8a4aebc1d65b05",
  "status": "offline"  // "online", "away", "dnd", "offline"
}
```

**Example:**
```javascript
socket.on("user_status_changed", ({ userId, status }) => {
  console.log(`User ${userId} is now ${status}`);
  // Update UI to show status indicator
});
```

---

### 3. New Message (Chat)

Emitted when a new chat message is created in a project or task.

**Event:** `new_message`  
**Payload:**
```json
{
  "_id": "69a52aa0cfb03e9a3d5cff75",
  "projectId": "69a52aa0cfb03e9a3d5cff75",
  "taskId": "69a28bd791593791d03b06df",  // Optional
  "ajiltniiId": "695c57521a8a4aebc1d65b05",
  "ajiltniiNer": "В. Энх-Амар",
  "medeelel": "Ажил эхэллээ",
  "turul": "text",  // "text", "zurag", "file"
  "fileZam": "uploads/image.jpg",  // If file/image
  "fileNer": "image.jpg",
  "khemjee": 1024000,
  "fType": "image/jpeg",
  "unshsan": ["695c57521a8a4aebc1d65b05"],  // Users who read
  "createdAt": "2026-02-26T09:00:00.000Z",
  "updatedAt": "2026-02-26T09:00:00.000Z"
}
```

**Example:**
```javascript
socket.on("new_message", (message) => {
  console.log("New message:", message);
  // Add message to chat UI
  // Update message list in real-time
});
```

**Rooms:**
- `project_{projectId}` - Project-level messages
- `task_{taskId}` - Task-specific messages

---

### 4. Messages Read

Emitted when messages are marked as read.

**Event:** `messages_read`  
**Payload:**
```json
{
  "chatIds": ["69a52aa0cfb03e9a3d5cff75", "69a28bd791593791d03b06df"],
  "ajiltniiId": "695c57521a8a4aebc1d65b05"
}
```

**Example:**
```javascript
socket.on("messages_read", ({ chatIds, ajiltniiId }) => {
  console.log(`User ${ajiltniiId} read messages:`, chatIds);
  // Update read receipts in UI
});
```

**Rooms:**
- `project_{projectId}` - Project room
- `task_{taskId}` - Task room

---

### 5. Project Created

Emitted when a new project is created.

**Event:** `project_created`  
**Payload:** Full project object

```json
{
  "_id": "69a52aa0cfb03e9a3d5cff75",
  "ner": "Шинэ төсөл",
  "tailbar": "Төслийн тайлбар",
  "tuluv": "shine",
  "udirdagchId": "695c57521a8a4aebc1d65b05",
  "ajiltnuud": ["695c57521a8a4aebc1d65b05"],
  "baiguullagiinId": "695c57511a8a4aebc1d65b02",
  "barilgiinId": "695c57511a8a4aebc1d65b03",
  "createdAt": "2026-03-02T06:13:52.934Z",
  "updatedAt": "2026-03-02T06:13:52.934Z"
}
```

**Example:**
```javascript
socket.on("project_created", (project) => {
  console.log("New project created:", project);
  // Add project to project list
  // Update UI in real-time
});
```

**Rooms:**
- `project_{projectId}` - Project room
- `barilga_{barilgiinId}` - Organization-wide room

---

### 6. Project Updated

Emitted when a project is updated.

**Event:** `project_updated`  
**Payload:** Updated project object (same structure as `project_created`)

**Example:**
```javascript
socket.on("project_updated", (project) => {
  console.log("Project updated:", project);
  // Update project in list
  // Refresh project details if viewing
});
```

**Rooms:**
- `project_{projectId}` - Project room
- `barilga_{barilgiinId}` - Organization-wide room

---

### 7. Task Created

Emitted when a new task is created.

**Event:** `task_created`  
**Payload:** Full task object

```json
{
  "_id": "69a28bd791593791d03b06df",
  "ner": "Даалгавар",
  "taskId": "БАР-0001",
  "projectId": "69a52aa0cfb03e9a3d5cff75",
  "hariutsagchId": "695c57521a8a4aebc1d65b05",
  "tuluv": "shine",
  "zereglel": "normal",
  "baiguullagiinId": "695c57511a8a4aebc1d65b02",
  "barilgiinId": "695c57511a8a4aebc1d65b03",
  "createdAt": "2026-03-02T06:13:52.934Z",
  "updatedAt": "2026-03-02T06:13:52.934Z"
}
```

**Example:**
```javascript
socket.on("task_created", (task) => {
  console.log("New task created:", task);
  // Add task to task list
  // Update UI in real-time
});
```

**Rooms:**
- `project_{projectId}` - Project room
- `task_{taskId}` - Task room

---

### 8. Task Updated

Emitted when a task is updated.

**Event:** `task_updated`  
**Payload:** Updated task object (same structure as `task_created`)

**Example:**
```javascript
socket.on("task_updated", (task) => {
  console.log("Task updated:", task);
  // Update task in list
  // Refresh task details if viewing
});
```

**Rooms:**
- `project_{projectId}` - Project room
- `task_{taskId}` - Task room

---

### 9. New Notification

Emitted when a new notification is created for a user.

**Event:** `new_notification`  
**Payload:**
```json
{
  "_id": "69a52aa0cfb03e9a3d5cff75",
  "ajiltniiId": "695c57521a8a4aebc1d65b05",
  "baiguullagiinId": "695c57511a8a4aebc1d65b02",
  "barilgiinId": "695c57511a8a4aebc1d65b03",
  "projectId": "69a52aa0cfb03e9a3d5cff75",
  "taskId": "69a28bd791593791d03b06df",
  "turul": "taskCreated",  // "taskCreated", "taskCompleted", "projectCreated", etc.
  "title": "Шинэ даалгавар",
  "message": "Даалгавар танд хуваарилагдлаа",
  "kharsanEsekh": false,  // Read status
  "object": { /* Related object data */ },
  "createdAt": "2026-03-02T06:13:52.934Z"
}
```

**Example:**
```javascript
socket.on("new_notification", (notification) => {
  console.log("New notification:", notification);
  // Show notification badge
  // Display notification toast/popup
  // Update notification count
});
```

**Rooms:**
- `user_{userId}` - User-specific notification room

---

## 📋 Complete Example

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:8000");

// Connection
socket.on("connect", () => {
  console.log("Connected:", socket.id);
  
  // Set user online
  socket.emit("user_online", {
    userId: "695c57521a8a4aebc1d65b05",
    status: "online"
  });
  
  // Join notification room
  socket.emit("join_notifications", {
    userId: "695c57521a8a4aebc1d65b05"
  });
  
  // Join project room
  socket.emit("join_room", {
    projectId: "69a52aa0cfb03e9a3d5cff75"
  });
  
  // Join task room
  socket.emit("join_room", {
    projectId: "69a52aa0cfb03e9a3d5cff75",
    taskId: "69a28bd791593791d03b06df"
  });
});

// Listen for online users
socket.on("online_users", (users) => {
  console.log("Online users:", users);
});

// Listen for status changes
socket.on("user_status_changed", ({ userId, status }) => {
  console.log(`User ${userId} is now ${status}`);
});

// Listen for new messages
socket.on("new_message", (message) => {
  console.log("New message:", message);
  // Update chat UI
});

// Listen for read receipts
socket.on("messages_read", ({ chatIds, ajiltniiId }) => {
  console.log("Messages read:", chatIds);
  // Update read indicators
});

// Listen for project events
socket.on("project_created", (project) => {
  console.log("Project created:", project);
  // Add to project list
});

socket.on("project_updated", (project) => {
  console.log("Project updated:", project);
  // Update project in list
});

// Listen for task events
socket.on("task_created", (task) => {
  console.log("Task created:", task);
  // Add to task list
});

socket.on("task_updated", (task) => {
  console.log("Task updated:", task);
  // Update task in list
});

// Listen for notifications
socket.on("new_notification", (notification) => {
  console.log("New notification:", notification);
  // Show notification
});

// Change status
socket.emit("change_status", { status: "away" });

// Disconnect
socket.on("disconnect", () => {
  console.log("Disconnected");
});
```

---

## 🏠 Room Structure

### Room Types

1. **Project Rooms:** `project_{projectId}`
   - Receives: `new_message`, `project_created`, `project_updated`, `task_created`, `task_updated`, `messages_read`

2. **Task Rooms:** `task_{taskId}`
   - Receives: `new_message`, `task_created`, `task_updated`, `messages_read`

3. **User Rooms:** `user_{userId}`
   - Receives: `new_notification`

4. **Organization Rooms:** `barilga_{barilgiinId}`
   - Receives: `project_created`, `project_updated`

---

## 🔄 Event Flow Summary

### Project Creation Flow:
1. Client creates project via REST API: `POST /projects`
2. Server emits:
   - `new_message` → `project_{projectId}`
   - `project_created` → `project_{projectId}` and `barilga_{barilgiinId}`
   - `new_notification` → `user_{userId}` (for each member)

### Task Creation Flow:
1. Client creates task via REST API: `POST /tasks`
2. Server emits:
   - `new_message` → `project_{projectId}` and `task_{taskId}`
   - `task_created` → `project_{projectId}` and `task_{taskId}`
   - `new_notification` → `user_{hariutsagchId}`

### Chat Message Flow:
1. Client sends message via REST API: `POST /chats`
2. Server emits:
   - `new_message` → `project_{projectId}` or `task_{taskId}`

### Task Update Flow:
1. Client updates task via REST API: `PUT /tasks/:id`
2. Server emits:
   - `task_updated` → `project_{projectId}` and `task_{taskId}`
   - `new_notification` → `user_{hariutsagchId}` (if completed)

---

## ⚠️ Notes

- All socket events are real-time and require the client to be connected
- Rooms are automatically cleaned up when all users leave
- User status is tracked server-side and persists across reconnections
- Notifications are stored in the database and also emitted via socket
- Always join rooms after connection is established
- Use `leave_room` when navigating away to reduce unnecessary events

---

## 🔐 Authentication

Socket.IO connections do not require authentication by default. However, you should:

1. Validate user identity when emitting `user_online`
2. Only join rooms for projects/tasks the user has access to
3. Handle authentication errors gracefully

For production, consider implementing Socket.IO authentication middleware.
