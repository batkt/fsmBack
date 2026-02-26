# FSM Mobile API Documentation

**Base URL:** `http://localhost:8000`

---

## 🔐 Auth

### Login
```
POST /login
```
**Body:**
```json
{
  "nevtrekhNer": "admin",
  "nuutsUg": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJI...",
  "result": { "_id": "612f457d...", "ner": "CAdmin", "baiguullagiinId": "612f457d..." },
  "baiguullaga": { "_id": "...", "ner": "Байгууллагын нэр" }
}
```
> ⚠️ Save the `token` and `result._id` — you'll need them for all requests.

### Get Current User
```
GET /me
Authorization: Bearer <token>
```

---

## 📁 Projects (Төсөл)

### My Projects (Login хийсний дараа)
Get projects assigned to the logged-in user.
```
GET /projects
Authorization: Bearer <token>
```
Or without token:
```
GET /projects?ajiltniiId=612f457d185280db676d0b53
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `ajiltniiId` | String | Filter by assigned employee |
| `baiguullagiinId` | String | Filter by organization |
| `barilgiinId` | String | Filter by building |
| `tuluv` | String | `shine`, `khiigdej bui`, `duussan` |

### Get Single Project
```
GET /projects/:id
```

### Create Project
```
POST /projects
```
```json
{
  "ner": "Барилга А засвар",
  "tailbar": "1-р давхрын засварын ажил",
  "tuluv": "shine",
  "color": "#FF5733",
  "ekhlekhOgnoo": "2026-02-25",
  "duusakhOgnoo": "2026-04-25",
  "udirdagchId": "695c57521a8a4aebc1d65b05",
  "ajiltnuud": ["698885ba9d9acf9deb646045"],
  "baiguullagiinId": "612f457d185280db676d0b51",
  "barilgiinId": "695c57511a8a4aebc1d65b03"
}
```

### Update Project
```
PUT /projects/:id
```
```json
{ 
  "tuluv": "khiigdej bui",
  "color": "#00FF00" 
}
```

### Delete Project
```
DELETE /projects/:id
```

---

## ✅ Tasks (Даалгавар)

> Each task gets an auto-generated `taskId` like `БАР-0001` (first 3 letters of project name + sequential number).

### List Tasks
```
GET /tasks?projectId=...&barilgiinId=...
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `projectId` | String | Filter by project |
| `baiguullagiinId` | String | Filter by organization |
| `barilgiinId` | String | Filter by building |
| `tuluv` | String | `shine`, `khiigdej bui`, `shalga`, `duussan` |
| `zereglel` | String | `nen yaraltai`, `yaraltai`, `engiin`, `baga` |
| `hariutsagchId` | String | Filter by assigned person |

### Get Single Task
```
GET /tasks/:id
```

### Create Task
```
POST /tasks
```
```json
{
  "projectId": "699eb533...",
  "ner": "Notification Setup",
  "tailbar": "Configure firebase",
  "zereglel": "yaraltai",
  "tuluv": "shine",
  "hariutsagchId": "612f457d...",
  "ajiltnuud": ["612f457d..."],
  "ekhlekhTsag": "2026-02-26T09:00:00Z",
  "duusakhTsag": "2026-02-28T18:00:00Z",
  "baiguullagiinId": "612f457d...",
  "barilgiinId": "622ca393..."
}
```

### Update Task
```
PUT /tasks/:id
```
```json
{ "tuluv": "duussan" }
```

### Delete Task
```
DELETE /tasks/:id
```

---

## 📝 SubTasks (Дэд даалгавар)

### List SubTasks
```
GET /subtasks?taskId=...
```

### Create SubTask
```
POST /subtasks
```
```json
{
  "taskId": "...",
  "projectId": "...",
  "barilgiinId": "...",
  "baiguullagiinId": "...",
  "ner": "Check pipe pressure",
  "duussan": false
}
```

### Toggle SubTask (Check/Uncheck)
```
PUT /subtasks/:id
```
```json
{ "duussan": true }
```

### Delete SubTask
```
DELETE /subtasks/:id
```

---

## 📜 Task History (Түүх)

### List History
```
GET /task-tuukh?projectId=...&barilgiinId=...
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "sourceTaskId": "...",
      "taskCode": "БАР-0001",
      "ner": "Notification Setup",
      "ajiltniiNer": "В. Энх-Амар",
      "uildel": "completed",
      "turul": "task",
      "createdAt": "2026-02-26T08:15:00Z"
    }
  ]
}
```

---

## 💬 Chat (REST)

### Get Messages
```
GET /chats?projectId=...&taskId=...
```

### Send Text Message
```
POST /chats
```
```json
{
  "projectId": "...",
  "taskId": "...",
  "medeelel": "Ажил эхэллээ",
  "turul": "text",
  "barilgiinId": "...",
  "baiguullagiinId": "...",
  "ajiltniiId": "...",
  "ajiltniiNer": "CAdmin"
}
```

### Send File (Image, ZIP, RAR, PDF, DOCX)
```
POST /chats/upload
Content-Type: multipart/form-data
```
**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | Binary | The file to upload |
| `projectId` | String | Required |
| `taskId` | String | Optional |
| `barilgiinId` | String | Required |
| `baiguullagiinId` | String | Required |
| `ajiltniiId` | String | Required |
| `ajiltniiNer` | String | Required |
| `medeelel` | String | Optional caption |

> Images auto-detect as `turul: "zurag"`, everything else is `turul: "file"`.
> Files are accessible at: `http://localhost:8000/uploads/[filename]`

### Delete Message
```
DELETE /chats/:id
```

---

## 📦 Baraa (Бараа материал)

### List
```
GET /baraas?barilgiinId=...&turul=...
```

### Create
```
POST /baraas
```
```json
{
  "ner": "Цэвэрлэгээний шингэн",
  "turul": "tseverlegch",
  "negj": "litr",
  "une": 15000,
  "uldegdel": 50,
  "baiguullagiinId": "...",
  "barilgiinId": "..."
}
```

### Update / Delete
```
PUT /baraas/:id
DELETE /baraas/:id
```

---

## 👤 Uilchluulegch (Үйлчлүүлэгч)

### List
```
GET /uilchluulegch?barilgiinId=...
```

### Create
```
POST /uilchluulegch
```
```json
{
  "ner": "Бат-Эрдэнэ",
  "utas": ["99112233"],
  "baiguullagiinId": "...",
  "barilgiinId": "..."
}
```

### Update / Delete
```
PUT /uilchluulegch/:id
DELETE /uilchluulegch/:id
```

---

## 🔌 WebSocket (Socket.IO)

**Connection:** `http://localhost:8000`

### Connect & Go Online
```dart
// Flutter example
final socket = io('http://localhost:8000');
socket.emit('user_online', { 'userId': 'AJILTAN_ID', 'status': 'online' });
```

### Join Chat Room
```dart
socket.emit('join_room', { 'projectId': '...', 'taskId': '...' });
```

### Listen for Messages
```dart
socket.on('new_message', (data) {
  // Update UI with new chat message
});
```

### Change Status
```dart
socket.emit('change_status', { 'status': 'away' }); // online, away, dnd
```

### Listen for User Status
```dart
socket.on('user_status_changed', (data) {
  // data = { userId: '...', status: 'offline' }
});
```

### Leave Room
```dart
socket.emit('leave_room', { 'projectId': '...' });
```

---

## ⚠️ Error Response Format
```json
{
  "success": false,
  "message": "Алдааны тайлбар"
}
```
