# CHAT & WEBSOCKET API

This document describes how to implement real-time chat and user presence tracking in the FSM application.

## 🔌 WebSocket Connection
**URL:** `http://localhost:8000`  
**Protocol:** Socket.IO

---

## 💬 Messaging System

### 1. Joining Rooms
To receive messages in real-time, the client must join a specific room.

*   **Event:** `join_room`
*   **Data Object:**
    ```json
    {
      "projectId": "67bed...", // Always required
      "taskId": "67bed..."     // Optional: Only if chatting inside a task
    }
    ```

### 2. Receiving Messages
Listen for this event to update the UI when a new message arrives.

*   **Event:** `new_message`
*   **Payload:**
    ```json
    {
      "_id": "67bed...",
      "projectId": "...",
      "taskId": "...",
      "ajiltniiId": "...",
      "ajiltniiNer": "В. Энх-Амар",
      "medeelel": "Ажил эхэллээ",
      "turul": "text", 
      "createdAt": "2026-02-26T09:00:00.000Z"
    }
    ```

### 3. Automatic System Messages
The server automatically creates and emits messages when:
*   **Project Created:** Sent to `project_[ID]` room.
*   **Task Created:** Sent to both `project_[ID]` and `task_[ID]` rooms.

---

## 👤 User Presence (Online/Offline)

### 1. Set Initial Connection
Call this immediately after connecting the socket.

*   **Event:** `user_online`
*   **Data:**
    ```json
    {
      "userId": "67bed...",
      "status": "online" // Options: online, away, dnd
    }
    ```

### 2. Update Status
*   **Event:** `change_status`
*   **Data:**
    ```json
    { "status": "away" }
    ```

### 3. Monitoring Others
Listen for this event to show status indicators (green/yellow/red dots) next to user names.

*   **Event:** `user_status_changed`
*   **Data:**
    ```json
    {
      "userId": "67bed...",
      "status": "offline"
    }
    ```

---

## 📜 Chat History (REST API)

### Get Messages
*   **URL:** `GET /chats?projectId=...&taskId=...`
*   **Description:** Fetches historical messages. If `taskId` is omitted, it returns project-level chat.

### Send Message
*   **URL:** `POST /chats`
*   **Body:** Same as payload in `new_message`. 
*   **Action:** This saves to DB and automatically triggers the WebSocket event for all connected users in that room.

### Sending Files (RAR, ZIP, Images, Documents)
To send a file, send a `multipart/form-data` request.

*   **URL**: `POST /chats/upload`
*   **Method**: `POST`
*   **Content-Type**: `multipart/form-data`
*   **Form Data**:
    *   `file`: The binary file (RAR, ZIP, JPG, PDF, DOCX, etc.)
    *   `projectId`: (String)
    *   `taskId`: (String, Optional)
    *   `barilgiinId`: (String)
*   **Response**: Returns the chat message object including `fileZam` and `turul` (`zurag` for images, `file` for others).
*   **Action**: The server saves the file to `/uploads`, creates a chat record, and broadcasts a `new_message` event with the file link.

