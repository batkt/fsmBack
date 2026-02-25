# FSM Backend API Documentation

**Base URL:** `http://192.168.1.88:8000`

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
  "result": { "_id": "...", "ner": "Админ", "baiguullagiinId": "..." },
  "baiguullaga": { "_id": "...", "ner": "Байгууллагын нэр" }
}
```

---

### Get Me (Current User)

```
GET /me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "ajiltan": { "_id": "...", "ner": "Админ", "nevtrekhNer": "admin" },
  "baiguullaga": { "_id": "...", "ner": "Байгууллагын нэр" }
}
```

---

## 📁 Projects (Төсөл)

### List Projects

```
GET /projects
Authorization: Bearer <token>
```

**Query Params (optional):**
| Param | Description |
|-------|-------------|
| `tuluv` | `shine`, `khiigdej bui`, `duussan` |
| `barilgiinId` | Барилгын ID |

**Example:** `GET /projects?tuluv=shine&barilgiinId=695c57511a8a4aebc1d65b03`

---

### Get Project

```
GET /projects/:id
Authorization: Bearer <token>
```

---

### Create Project

```
POST /projects
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "ner": "Барилга А засвар",
  "tailbar": "1-р давхрын засварын ажил",
  "tuluv": "shine",
  "ekhlekhOgnoo": "2026-02-25",
  "duusakhOgnoo": "2026-04-25",
  "udirdagchId": "695c57521a8a4aebc1d65b05",
  "ajiltnuud": ["698885ba9d9acf9deb646045"],
  "barilgiinId": "695c57511a8a4aebc1d65b03"
}
```

> `baiguullagiinId` — токеноос автоматаар авна

**Required fields:** `ner`, `barilgiinId`

---

### Update Project

```
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:** (partial update — only send fields you want to change)
```json
{
  "tuluv": "khiigdej bui",
  "tailbar": "Шинэчлэгдсэн тайлбар"
}
```

---

### Delete Project

```
DELETE /projects/:id
Authorization: Bearer <token>
```

---

## ✅ Tasks (Даалгавар)

### List Tasks

```
GET /tasks
Authorization: Bearer <token>
```

**Query Params (optional):**
| Param | Description |
|-------|-------------|
| `projectId` | Төслийн ID |
| `tuluv` | `shine`, `khiigdej bui`, `shalga`, `duussan` |
| `zereglel` | `nen yaraltai`, `yaraltai`, `engiin`, `baga` |
| `hariutsagchId` | Хариуцагчийн ID |
| `barilgiinId` | Барилгын ID |

**Example:** `GET /tasks?projectId=699ead973f9a3702634ffda8&tuluv=shine`

---

### Get Task

```
GET /tasks/:id
Authorization: Bearer <token>
```

---

### Create Task

```
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "projectId": "699ead973f9a3702634ffda8",
  "ner": "1-р давхрын шал засах",
  "tailbar": "Хуучин шалыг хуулж шинээр цутгах",
  "zereglel": "yaraltai",
  "tuluv": "shine",
  "hariutsagchId": "695c57521a8a4aebc1d65b05",
  "ajiltnuud": ["698885ba9d9acf9deb646045"],
  "ekhlekhTsag": "2026-02-25",
  "duusakhTsag": "2026-03-15",
  "khugatsaaDuusakhOgnoo": "2026-03-15",
  "barilgiinId": "695c57511a8a4aebc1d65b03"
}
```

> `baiguullagiinId` — токеноос автоматаар авна

**Required fields:** `projectId`, `ner`, `barilgiinId`

---

### Update Task

```
PUT /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "tuluv": "khiigdej bui",
  "hariutsagchId": "698885ba9d9acf9deb646045"
}
```

---

### Delete Task

```
DELETE /tasks/:id
Authorization: Bearer <token>
```

> Устгахад задын түүхийг `taskTuukh` collection-д хадгална

---

## 📜 Task History (Даалгаврын түүх)

### List Task History

```
GET /task-tuukh
Authorization: Bearer <token>
```

**Query Params (optional):**
| Param | Description |
|-------|-------------|
| `projectId` | Төслийн ID |
| `barilgiinId` | Барилгын ID |

---

### Get Task History

```
GET /task-tuukh/:id
Authorization: Bearer <token>
```

---

## 💬 Chat (Чат)

### List Chats

```
GET /chats
Authorization: Bearer <token>
```

**Query Params (optional):**
| Param | Description |
|-------|-------------|
| `projectId` | Төслийн ID |
| `taskId` | Даалгаврын ID |

**Example:** `GET /chats?projectId=699ead973f9a3702634ffda8&taskId=699eb1234567`

---

### Create Chat

```
POST /chats
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "projectId": "699ead973f9a3702634ffda8",
  "taskId": "699eb1234567",
  "medeelel": "Шалны ажил эхэллээ",
  "turul": "text",
  "barilgiinId": "695c57511a8a4aebc1d65b03"
}
```

> `ajiltniiId`, `ajiltniiNer`, `baiguullagiinId` — токеноос автоматаар авна

**Required fields:** `projectId`, `medeelel`, `barilgiinId`

**turul values:** `text`, `zurag`, `file`

---

### Delete Chat

```
DELETE /chats/:id
Authorization: Bearer <token>
```

---

## 📦 Baraa (Бараа)

### List Baraas

```
GET /baraas
Authorization: Bearer <token>
```

**Query Params (optional):**
| Param | Description |
|-------|-------------|
| `turul` | `tseverlegch`, `ugaalgiin`, `ariutgagch`, `bagaj`, `busad` |
| `barilgiinId` | Барилгын ID |
| `idevhtei` | `true` / `false` |

---

### Get Baraa

```
GET /baraas/:id
Authorization: Bearer <token>
```

---

### Create Baraa

```
POST /baraas
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "ner": "Цэвэрлэгээний шингэн",
  "turul": "tseverlegch",
  "tailbar": "Шалны цэвэрлэгээнд",
  "negj": "litr",
  "une": 15000,
  "uldegdel": 50,
  "doodUldegdel": 10,
  "barcode": "4901234567890",
  "brand": "CleanMax",
  "niiluulegch": "Нийлүүлэгч ХХК",
  "barilgiinId": "695c57511a8a4aebc1d65b03"
}
```

> `baiguullagiinId` — токеноос автоматаар авна

**Required fields:** `ner`, `barilgiinId`

**negj values:** `shirheg`, `litr`, `kg`, `haire`, `bogts`, `dana`

---

### Update Baraa

```
PUT /baraas/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "uldegdel": 45,
  "une": 16000
}
```

---

### Delete Baraa

```
DELETE /baraas/:id
Authorization: Bearer <token>
```

---

## 👤 Uilchluulegch (Үйлчлүүлэгч)

### List Uilchluulegch

```
GET /uilchluulegch
Authorization: Bearer <token>
```

**Query Params (optional):**
| Param | Description |
|-------|-------------|
| `tuluv` | `idevhtei`, `idevhgui` |
| `barilgiinId` | Барилгын ID |

---

### Get Uilchluulegch

```
GET /uilchluulegch/:id
Authorization: Bearer <token>
```

---

### Create Uilchluulegch

```
POST /uilchluulegch
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "ner": "Бат-Эрдэнэ",
  "register": "УБ12345678",
  "mail": "bat@example.com",
  "utas": ["99112233", "88445566"],
  "khayag": "Хан-Уул дүүрэг, 1-р хороо",
  "tuluv": "idevhtei",
  "tailbar": "VIP үйлчлүүлэгч",
  "gereeNomer": "GR-2026-001",
  "gereeEkhlekh": "2026-01-01",
  "gereeDuusakh": "2027-01-01",
  "barilgiinId": "695c57511a8a4aebc1d65b03"
}
```

> `baiguullagiinId` — токеноос автоматаар авна

**Required fields:** `ner`, `barilgiinId`

---

### Update Uilchluulegch

```
PUT /uilchluulegch/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "tuluv": "idevhgui",
  "utas": ["99112233"]
}
```

---

### Delete Uilchluulegch

```
DELETE /uilchluulegch/:id
Authorization: Bearer <token>
```

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Алдааны тайлбар"
}
```
