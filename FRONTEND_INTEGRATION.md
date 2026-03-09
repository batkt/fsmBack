# Frontend Integration Guide

> **Backend**: `fsmBack` — Node + Express + MongoDB + Socket.IO
> **Auth**: Every endpoint requires `Authorization: Bearer <token>` header
> **Base URL**: `http://<your-server>:<PORT>`

---

## 1. Task Points — Admin gives 0–10 after task is done

### New fields on the `task` document

| Field            | Type             | Description                 |
| ---------------- | ---------------- | --------------------------- |
| `onooson`        | `Number \| null` | Score (0–10) given by admin |
| `onoosonTailbar` | `String`         | Admin note / reason         |
| `onoosonOgnoo`   | `Date`           | When the score was given    |
| `onoosonAdminId` | `String`         | ID of the admin who scored  |

---

### Endpoints

#### POST `/tasks/:id/onoo` — Give points

**Rules**

- Task `tuluv` must be `"duussan"` (completed) before a score can be given.
- Call this only from an admin / manager UI.

**Request body**

```json
{
  "onooson": 8,
  "onoosonTailbar": "Цаглавартаа дугуй хийж дуусгасан"
}
```

**Success response (200)**

```json
{
  "success": true,
  "message": "Оноо амжилттай хадгалагдлаа (8/10)",
  "data": {},
  "kpi": {
    "kpiOnoo": 34,
    "kpiDaalgavarToo": 5,
    "kpiDundaj": 6.8,
    "kpiHuvv": 68,
    "updatedUser": {}
  }
}
```

**Error responses**

| HTTP | Reason                                       |
| ---- | -------------------------------------------- |
| 400  | `onooson` missing or outside 0–10            |
| 400  | Task not yet completed (`tuluv ≠ "duussan"`) |
| 404  | Task not found                               |

---

#### GET `/tasks/:id/onoo` — Read current score

**Response**

```json
{
  "success": true,
  "data": {
    "taskId": "...",
    "onooson": 8,
    "onoosonTailbar": "...",
    "onoosonOgnoo": "2026-03-09T00:00:00.000Z",
    "onoosonAdminId": "..."
  }
}
```

---

### React snippet — Admin score form

```jsx
// AdminScoreModal.jsx
import { useState } from "react";

export default function AdminScoreModal({ task, token, onSuccess }) {
  const [points, setPoints] = useState(task.onooson ?? 5);
  const [note, setNote] = useState(task.onoosonTailbar ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (task.tuluv !== "duussan") {
      setError("Даалгавар дуусаагүй байна");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/tasks/${task._id}/onoo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ onooson: points, onoosonTailbar: note }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onSuccess(json.data, json.kpi);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="score-modal">
      <h3>Оноо өгөх</h3>

      <label>Оноо: {points} / 10</label>
      <input
        type="range"
        min={0}
        max={10}
        step={0.5}
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
      />

      <textarea
        placeholder="Тайлбар (заавал биш)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
      />

      {error && <p className="error">{error}</p>}

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Хадгалж байна…" : "Хадгалах"}
      </button>
    </div>
  );
}
```

---

## 2. KPI — Auto-calculated performance indicator

### New fields on the `uilchluulegch` (user) document

These are **automatically updated** every time `POST /tasks/:id/onoo` is called.

| Field                | Type     | Description                          |
| -------------------- | -------- | ------------------------------------ |
| `kpiOnoo`            | `Number` | Total points accumulated             |
| `kpiDaalgavarToo`    | `Number` | Count of tasks that received a score |
| `kpiDundaj`          | `Number` | Average score per task (0–10)        |
| `kpiHuvv`            | `Number` | KPI % = `(kpiDundaj / 10) × 100`     |
| `kpiShineelsenOgnoo` | `Date`   | Timestamp of last recalculation      |

**Formula**

```
kpiDundaj = sum(onooson) / count(scored tasks)
kpiHuvv   = (kpiDundaj / 10) × 100
```

---

### Endpoints

#### GET `/users/:id/kpi` — Fetch KPI for a user

**Response**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ner": "Болд",
    "kpiOnoo": 34,
    "kpiDaalgavarToo": 5,
    "kpiDundaj": 6.8,
    "kpiHuvv": 68,
    "kpiShineelsenOgnoo": "2026-03-09T00:00:00.000Z"
  }
}
```

#### POST `/users/:id/kpi/refresh` — Force-recalculate (admin)

Returns the same shape as the GET above with freshly recalculated values.

---

### Socket.IO events (KPI)

When an admin saves a score, the assigned user receives **two** real-time events
on their personal room `user_<userId>`:

| Event              | Payload                                                    |
| ------------------ | ---------------------------------------------------------- |
| `kpi_updated`      | `{ userId, kpiOnoo, kpiDaalgavarToo, kpiDundaj, kpiHuvv }` |
| `new_notification` | Standard notification document                             |

```js
socket.on("kpi_updated", (data) => {
  if (data.userId === currentUser._id) {
    setKpi(data);
  }
});
```

---

### React snippet — KPI card with circular progress

```jsx
// KpiCard.jsx
import { useEffect, useState } from "react";

const COLOR = (pct) =>
  pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";

export default function KpiCard({ userId, token, socket }) {
  const [kpi, setKpi] = useState(null);

  // Initial fetch
  useEffect(() => {
    fetch(`/users/${userId}/kpi`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => json.success && setKpi(json.data));
  }, [userId, token]);

  // Real-time update
  useEffect(() => {
    if (!socket) return;
    socket.on("kpi_updated", (data) => {
      if (data.userId === userId) setKpi((prev) => ({ ...prev, ...data }));
    });
    return () => socket.off("kpi_updated");
  }, [socket, userId]);

  if (!kpi) return null;

  const pct = kpi.kpiHuvv ?? 0;
  const color = COLOR(pct);
  // SVG circle: r=50 → circumference ≈ 314
  const dash = (pct / 100) * 314;

  return (
    <div className="kpi-card">
      <h4>KPI — {kpi.ner}</h4>

      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* Progress */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${dash} 314`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="65"
          textAnchor="middle"
          fontSize="22"
          fill={color}
          fontWeight="bold"
        >
          {pct}%
        </text>
      </svg>

      <table>
        <tbody>
          <tr>
            <td>Нийт оноо</td> <td>{kpi.kpiOnoo}</td>
          </tr>
          <tr>
            <td>Дундаж</td> <td>{kpi.kpiDundaj} / 10</td>
          </tr>
          <tr>
            <td>Оноогдсон даалгавар</td>
            <td>{kpi.kpiDaalgavarToo}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

---

## 3. Chat — Delete, Edit & Reply

### New fields on the `chat` document

| Field                 | Type      | Description                                  |
| --------------------- | --------- | -------------------------------------------- |
| `isDeleted`           | `Boolean` | Soft-delete flag (body cleared, record kept) |
| `isEdited`            | `Boolean` | Whether the message was edited               |
| `editedAt`            | `Date`    | When it was last edited                      |
| `replyTo.chatId`      | `String`  | `_id` of the message being replied to        |
| `replyTo.medeelel`    | `String`  | Snapshot of the original message text        |
| `replyTo.ajiltniiNer` | `String`  | Name of the original sender                  |
| `replyTo.turul`       | `String`  | Type of the original message                 |

---

### Endpoints

#### DELETE `/chats/:id` — Soft-delete own message

- Only the **original sender** can delete.
- `isDeleted` is set to `true` and `medeelel` is cleared.
- The record is kept so reply threads can still show _"Мессеж устгагдлаа"_.

**Success response**

```json
{
  "success": true,
  "message": "Мессеж амжилттай устгагдлаа",
  "data": {}
}
```

| HTTP | Reason                  |
| ---- | ----------------------- |
| 403  | Not the original sender |
| 404  | Chat not found          |

---

#### PATCH `/chats/:id` — Edit own message

- Only the **original sender** can edit.
- Cannot edit an already-deleted message.

**Request body**

```json
{ "medeelel": "Шинэ текст" }
```

**Success response**

```json
{
  "success": true,
  "data": {}
}
```

| HTTP | Reason                      |
| ---- | --------------------------- |
| 400  | Empty or missing `medeelel` |
| 400  | Message is already deleted  |
| 403  | Not the original sender     |
| 404  | Chat not found              |

---

#### POST `/chats` — Reply to a message (existing endpoint)

Pass the `replyTo` object in the body when creating a new message:

```json
{
  "projectId": "...",
  "taskId": "...",
  "barilgiinId": "...",
  "medeelel": "За тэгье!",
  "replyTo": {
    "chatId": "<original_message_id>",
    "medeelel": "Маргааш уулзъя",
    "ajiltniiNer": "Болд",
    "turul": "text"
  }
}
```

---

### Socket.IO events (Chat)

| Event             | Room                         | Payload                            |
| ----------------- | ---------------------------- | ---------------------------------- |
| `message_deleted` | `task_<id>` / `project_<id>` | `{ chatId, deletedBy }`            |
| `message_edited`  | same                         | Full updated chat document         |
| `new_message`     | same                         | Full new chat document (unchanged) |

```js
// In your chat hook / provider
socket.on("message_deleted", ({ chatId }) => {
  setMessages((prev) =>
    prev.map((m) =>
      m._id === chatId ? { ...m, isDeleted: true, medeelel: "" } : m,
    ),
  );
});

socket.on("message_edited", (updated) => {
  setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
});
```

---

### React snippet — ChatMessage component

```jsx
// ChatMessage.jsx
import { useState } from "react";

export default function ChatMessage({ msg, currentUserId, token, onReply }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.medeelel);
  const isOwn = msg.ajiltniiId === currentUserId;

  const handleDelete = async () => {
    if (!window.confirm("Устгах уу?")) return;
    await fetch(`/chats/${msg._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    // UI updated via message_deleted socket event
  };

  const handleEdit = async () => {
    const res = await fetch(`/chats/${msg._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ medeelel: editText }),
    });
    const json = await res.json();
    if (json.success) setEditing(false);
    // UI updated via message_edited socket event
  };

  // Soft-deleted message placeholder
  if (msg.isDeleted) {
    return (
      <div className="msg msg--deleted">
        <em>Мессеж устгагдлаа</em>
      </div>
    );
  }

  return (
    <div className={`msg ${isOwn ? "msg--own" : ""}`}>
      {/* Reply preview */}
      {msg.replyTo?.chatId && (
        <div className="msg__reply-preview">
          <strong>{msg.replyTo.ajiltniiNer}</strong>
          <span>{msg.replyTo.medeelel || "(медиа)"}</span>
        </div>
      )}

      {/* Sender name */}
      <span className="msg__sender">{msg.ajiltniiNer}</span>

      {/* Message body / edit mode */}
      {editing ? (
        <div className="msg__edit">
          <input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEdit()}
            autoFocus
          />
          <button onClick={handleEdit}>Хадгалах</button>
          <button onClick={() => setEditing(false)}>Болих</button>
        </div>
      ) : (
        <p className="msg__text">
          {msg.medeelel}
          {msg.isEdited && (
            <small className="msg__edited"> (засварлагдсан)</small>
          )}
        </p>
      )}

      {/* Action buttons */}
      <div className="msg__actions">
        <button onClick={() => onReply(msg)} title="Хариулах">
          ↩
        </button>
        {isOwn && !msg.isDeleted && (
          <>
            <button onClick={() => setEditing(true)} title="Засах">
              ✏️
            </button>
            <button onClick={handleDelete} title="Устгах">
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Quick Reference — All new endpoints

| Method   | URL                      | Description                                   |
| -------- | ------------------------ | --------------------------------------------- |
| `POST`   | `/tasks/:id/onoo`        | Admin: give score (0–10) to a completed task  |
| `GET`    | `/tasks/:id/onoo`        | Get score info for a task                     |
| `GET`    | `/users/:id/kpi`         | Get KPI stats for a user                      |
| `POST`   | `/users/:id/kpi/refresh` | Force-recalculate KPI for a user (admin)      |
| `PATCH`  | `/chats/:id`             | Edit own chat message                         |
| `DELETE` | `/chats/:id`             | Soft-delete own chat message                  |
| `POST`   | `/chats`                 | Create message — now supports `replyTo` field |

## Quick Reference — New Socket.IO events

| Event             | Direction            | Payload                                                    |
| ----------------- | -------------------- | ---------------------------------------------------------- |
| `message_deleted` | Server → room        | `{ chatId, deletedBy }`                                    |
| `message_edited`  | Server → room        | Full updated chat doc                                      |
| `kpi_updated`     | Server → `user_<id>` | `{ userId, kpiOnoo, kpiDaalgavarToo, kpiDundaj, kpiHuvv }` |
