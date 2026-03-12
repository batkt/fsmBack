# tukhainBaaziinKholbolt

`tukhainBaaziinKholbolt` нь тухайн байгууллагын MongoDB холболтын обьект юм. `zevbackv2` пакетийн `tokenShalgakh` middleware-аар `req.body.tukhainBaaziinKholbolt` дээр тавигддаг.

---

## Хэрхэн тавигддаг вэ?

1. `tokenShalgakh` middleware нь `req.headers.authorization`-аас JWT токен задалж авна
2. Токеноос `baiguullagiinId` (байгууллагын ID)-г гаргаж авна
3. `db.kholboltuud` массиваас тухайн байгууллагын холболтыг олно:

```javascript
tukhainBaaziinKholbolt = kholboltuud.find(
  (a) => a.baiguullagiinId == tokenObject.baiguullagiinId
);
req.body.tukhainBaaziinKholbolt = tukhainBaaziinKholbolt;
```

---

## Обьектын бүтэц

| Property | Type | Тайлбар |
|---|---|---|
| `baaziinNer` | `String` | Баазын нэр (байгууллагын DB нэр) |
| `kholbolt` | `mongoose.Connection` | Үндсэн Mongoose холболт (бичих, унших) |
| `kholboltRead` | `mongoose.Connection` | Зөвхөн унших зориулалттай холболт (read-replica) |
| `kholboltBackupRead` | `mongoose.Connection` | Нөөц унших холболт |
| `baiguullagiinId` | `String` | Тухайн холболт хамаарах байгууллагын ID |

### Ерөнхий холболт (`erunkhiiKholbolt`)

| Property | Type | Тайлбар |
|---|---|---|
| `baaziinNer` | `String` | Үргэлж `"undsenBaaz"` |
| `kholbolt` | `mongoose.Connection` | Үндсэн баазын Mongoose холболт |

---

## Хэрхэн ашигладаг вэ?

### Model factory функцэд дамжуулах

```javascript
// Тухайн байгууллагын баазаас гэрээ хайх
var geree = await Geree(req.body.tukhainBaaziinKholbolt, true).findOne({ ... });

// Шинэ бичлэг үүсгэх
var data = new Geree(req.body.tukhainBaaziinKholbolt)(req.body);
```

### Session эхлүүлэх

```javascript
const session = await req.body.tukhainBaaziinKholbolt.kholbolt.startSession();
```

### CRUD үйлдлүүд (zevbackv2)

`zevbackv2`-ын `crud.js` дотор model-ын нэрээс хамаарч аль холболтыг ашиглахаа шийднэ:

```javascript
var baaziinKholbolt =
  modelName == 'baiguullaga' ||
  modelName == 'togtmol' ||
  modelName == 'khariltsagch'
    ? req.body.erunkhiiKholbolt        // ерөнхий баазаас
    : req.body.tukhainBaaziinKholbolt; // тухайн байгууллагын баазаас
```

---

## Холболтууд хэрхэн үүсдэг вэ?

`db.kholboltUusgey()` функц (`zevbackv2`) дотор:

1. Үндсэн холболт үүсгэж `kholboltuud` массивт нэмнэ:

```javascript
this.kholboltuud.push({
  baaziinNer: 'undsenBaaz',
  kholbolt: erunkhiiKholbolt,
});
```

2. `BaaziinMedeelel` collection-оос бүх байгууллагын баазын мэдээллийг уншина

3. Байгууллага бүрт холболт үүсгэж `kholboltuud` массивт нэмнэ:

```javascript
this.kholboltuud.push({
  baaziinNer: element.baaz,
  kholbolt: baaziinkholbolt,
  kholboltRead: kholboltRead,
  kholboltBackupRead: kholboltBackupRead,
  baiguullagiinId: element.baiguullagiinId,
});
```

---

## Дүгнэлт

`tukhainBaaziinKholbolt` нь **multi-tenant** архитектурын гол обьект бөгөөд байгууллага бүр өөрийн MongoDB баазтай байх боломжийг олгодог. Request бүрт JWT токеноос байгууллагыг таньж, зөв баазын холболтыг сонгон `req.body` дээр тавьдаг.
