# Chat API Endpoints

This document describes the chat endpoints and how they automatically create notifications.

## 🔐 Authentication

All endpoints require Bearer token in `Authorization` header:
```
Authorization: Bearer <token>
```

---

## 📤 Send Text Message

**Endpoint:** `POST /chats`  
**Auth:** Required

### Request Body

```json
{
  "projectId": "69a52aa0cfb03e9a3d5cff75",
  "taskId": "69a28bd791593791d03b06df",  // Optional: Only for task chat
  "medeelel": "Ажил эхэллээ, бүх зүйл сайн байна",
  "turul": "text",  // Optional: "text" (default), "zurag", "file"
  "barilgiinId": "695c57511a8a4aebc1d65b03",  // Optional: Auto-filled from token
  "baiguullagiinId": "695c57511a8a4aebc1d65b02",  // Optional: Auto-filled from token
  "ajiltniiId": "695c57521a8a4aebc1d65b05",  // Optional: Auto-filled from token
  "ajiltniiNer": "В. Энх-Амар"  // Optional: Auto-filled from token
}
```

**Required Fields:**
- `projectId` - Project ID

**Optional Fields:**
- `taskId` - Task ID (for task-specific chat)
- `medeelel` - Message text
- `turul` - Message type: `"text"` (default), `"zurag"`, `"file"`
- `barilgiinId` - Auto-filled from token if not provided
- `baiguullagiinId` - Auto-filled from token if not provided
- `ajiltniiId` - Auto-filled from token if not provided
- `ajiltniiNer` - Auto-filled from token if not provided

### Response

```json
{
  "success": true,
  "data": {
    "_id": "69a52aa0cfb03e9a3d5cff75",
    "projectId": "69a52aa0cfb03e9a3d5cff75",
    "taskId": "69a28bd791593791d03b06df",
    "ajiltniiId": "695c57521a8a4aebc1d65b05",
    "ajiltniiNer": "В. Энх-Амар",
    "medeelel": "Ажил эхэллээ, бүх зүйл сайн байна",
    "turul": "text",
    "baiguullagiinId": "695c57511a8a4aebc1d65b02",
    "barilgiinId": "695c57511a8a4aebc1d65b03",
    "unshsan": [],
    "createdAt": "2026-03-02T06:13:52.934Z",
    "updatedAt": "2026-03-02T06:13:52.934Z"
  }
}
```

### Automatic Notifications Created

When a text message is sent, notifications are automatically created for:
- Project manager
- All project members
- Task assigned user (if task chat)
- **Excludes:** Message sender

**Notification Details:**
```json
{
  "turul": "chatMessage",
  "title": "Даалгаврын мессеж",  // or "Төслийн мессеж" for project chat
  "message": "В. Энх-Амар: Ажил эхэллээ, бүх зүйл сайн байна",
  "projectId": "69a52aa0cfb03e9a3d5cff75",
  "taskId": "69a28bd791593791d03b06df"
}
```

---

## 📎 Upload File/Image

**Endpoint:** `POST /chats/upload`  
**Auth:** Required  
**Content-Type:** `multipart/form-data`

### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The file to upload (image, PDF, DOCX, ZIP, RAR, etc.) |
| `projectId` | String | Yes | Project ID |
| `taskId` | String | No | Task ID (for task chat) |
| `barilgiinId` | String | No | Auto-filled from token |
| `baiguullagiinId` | String | No | Auto-filled from token |
| `ajiltniiId` | String | No | Auto-filled from token |
| `ajiltniiNer` | String | No | Auto-filled from token |
| `medeelel` | String | No | Optional caption/message |

### File Type Detection

- **Images** (jpg, png, gif, etc.): Automatically set `turul: "zurag"`
- **Other files** (PDF, DOCX, ZIP, RAR, etc.): Automatically set `turul: "file"`

### Response

```json
{
  "success": true,
  "data": {
    "_id": "69a52aa0cfb03e9a3d5cff75",
    "projectId": "69a52aa0cfb03e9a3d5cff75",
    "taskId": "69a28bd791593791d03b06df",
    "ajiltniiId": "695c57521a8a4aebc1d65b05",
    "ajiltniiNer": "В. Энх-Амар",
    "medeelel": "Document.pdf",
    "turul": "file",  // or "zurag" for images
    "fileZam": "uploads/1234567890-123456789.pdf",
    "fileNer": "Document.pdf",
    "khemjee": 1024000,  // File size in bytes
    "fType": "application/pdf",  // MIME type
    "baiguullagiinId": "695c57511a8a4aebc1d65b02",
    "barilgiinId": "695c57511a8a4aebc1d65b03",
    "unshsan": [],
    "createdAt": "2026-03-02T06:13:52.934Z",
    "updatedAt": "2026-03-02T06:13:52.934Z"
  }
}
```

### Automatic Notifications Created

Same as text messages. For images/files:
- **Image:** `"Зураг илгээлээ"`
- **File:** `"Файл илгээлээ"`
- **With caption:** Uses the caption text

**Notification Example (Image):**
```json
{
  "turul": "chatMessage",
  "title": "Даалгаврын мессеж",
  "message": "В. Энх-Амар: Зураг илгээлээ",
  "zurag": "uploads/1234567890-123456789.jpg",
  "projectId": "69a52aa0cfb03e9a3d5cff75",
  "taskId": "69a28bd791593791d03b06df"
}
```

---

## 📥 Get Chat Messages

**Endpoint:** `GET /chats`  
**Auth:** Required

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | String | Yes | Project ID |
| `taskId` | String | No | Task ID (to filter task-specific messages) |
| `baiguullagiinId` | String | No | Auto-filled from token |

### Example

```
GET /chats?projectId=69a52aa0cfb03e9a3d5cff75&taskId=69a28bd791593791d03b06df
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "69a52aa0cfb03e9a3d5cff75",
      "projectId": "69a52aa0cfb03e9a3d5cff75",
      "taskId": "69a28bd791593791d03b06df",
      "ajiltniiId": "695c57521a8a4aebc1d65b05",
      "ajiltniiNer": "В. Энх-Амар",
      "medeelel": "Ажил эхэллээ",
      "turul": "text",
      "unshsan": ["695c57521a8a4aebc1d65b06"],
      "createdAt": "2026-03-02T06:13:52.934Z",
      "updatedAt": "2026-03-02T06:13:52.934Z"
    }
  ]
}
```

---

## ✅ Mark Messages as Read

**Endpoint:** `PUT /chats/read`  
**Auth:** Required

### Request Body

```json
{
  "chatIds": [
    "69a52aa0cfb03e9a3d5cff75",
    "69a28bd791593791d03b06df"
  ],
  "projectId": "69a52aa0cfb03e9a3d5cff75",
  "taskId": "69a28bd791593791d03b06df",
  "ajiltniiId": "695c57521a8a4aebc1d65b05"  // Optional: Auto-filled from token
}
```

**Required Fields:**
- `chatIds` - Array of chat message IDs to mark as read

**Optional Fields:**
- `projectId` - For Socket.IO broadcast
- `taskId` - For Socket.IO broadcast
- `ajiltniiId` - Auto-filled from token

### Response

```json
{
  "success": true,
  "message": "Амжилттай уншсан төлөвт шилжүүллээ."
}
```

**Socket Event:** Emits `messages_read` to project/task room

---

## 🗑️ Delete Chat Message

**Endpoint:** `DELETE /chats/:id`  
**Auth:** Required

### Example

```
DELETE /chats/69a52aa0cfb03e9a3d5cff75
```

### Response

```json
{
  "success": true,
  "message": "Чат амжилттай устгагдлаа"
}
```

---

## 🔌 Socket.IO Events

### Receiving Messages

**Event:** `new_message`  
**Rooms:** `project_{projectId}` or `task_{taskId}`

**Payload:** Same as chat object

### Receiving Notifications

**Event:** `new_notification`  
**Rooms:** `user_{userId}`

**Payload:** Notification object (see [MEDEGDEL_API.md](./MEDEGDEL_API.md))

---

## 📝 Complete Example

### Send Text Message

```javascript
const response = await fetch('http://localhost:8000/chats', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    projectId: '69a52aa0cfb03e9a3d5cff75',
    taskId: '69a28bd791593791d03b06df',
    medeelel: 'Ажил эхэллээ'
  })
});

const { data } = await response.json();
console.log('Chat created:', data);
```

### Upload File

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('projectId', '69a52aa0cfb03e9a3d5cff75');
formData.append('taskId', '69a28bd791593791d03b06df');
formData.append('medeelel', 'Optional caption');

const response = await fetch('http://localhost:8000/chats/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});

const { data } = await response.json();
console.log('File uploaded:', data);
```

### Listen for Messages (Socket.IO)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:8000");

// Join room
socket.emit("join_room", {
  projectId: "69a52aa0cfb03e9a3d5cff75",
  taskId: "69a28bd791593791d03b06df"
});

// Listen for new messages
socket.on("new_message", (chat) => {
  console.log("New message:", chat);
  // Update UI
});

// Listen for notifications
socket.emit("join_notifications", { userId: "695c57521a8a4aebc1d65b05" });
socket.on("new_notification", (notification) => {
  if (notification.turul === "chatMessage") {
    console.log("New chat notification:", notification);
    // Show notification badge
  }
});
```

---

## ⚠️ Notes

- **Notifications are created automatically** - No need to call notification endpoints separately
- **Sender is excluded** - You won't receive notifications for your own messages
- **File access:** Uploaded files are accessible at: `http://localhost:8000/uploads/{filename}`
- **Message preview:** Notifications show first 50 characters of text messages
- **Error handling:** Chat creation succeeds even if notification creation fails (errors are logged)

---

## 🔗 Related Documentation

- [CHAT_NOTIFICATIONS.md](./CHAT_NOTIFICATIONS.md) - Notification details
- [MEDEGDEL_API.md](./MEDEGDEL_API.md) - Full notification API
- [SOCKET_API.md](./SOCKET_API.md) - Socket.IO events
