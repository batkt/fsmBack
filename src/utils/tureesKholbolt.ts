import mongoose from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");

// Байгууллагын ҮНДСЭН (turees) баазын холболт.
//
// FSM хүсэлт дээрх `req.tukhainBaaziinKholbolt` нь FSM-ийн баазыг заадаг
// (`kholbolt === kholboltFSM`). Харин tureesBack-ийн "Зассан түүх" хуудас
// zassanBarimt-ыг байгууллагын үндсэн баазаас (baaziinMedeelel-ийн
// fsmEsekh-гүй мөрийн `baaz`) уншдаг. Тиймээс zassanBarimt-ыг FSM холболтоор
// бичвэл хуудсанд хэзээ ч харагдахгүй — энэ туслах үндсэн баазыг олж өгнө.

const kesh = new Map<string, any>();
const khuleegdejBui = new Map<string, Promise<any>>();

function idAsuulga(baiguullagiinId: string) {
  const utguud: any[] = [baiguullagiinId];
  if (mongoose.Types.ObjectId.isValid(baiguullagiinId)) {
    utguud.push(new mongoose.Types.ObjectId(baiguullagiinId));
  }
  return { $in: utguud };
}

function burtgelees(dbNer: string) {
  if (!Array.isArray(db.kholboltuud)) return null;
  return db.kholboltuud.find((c: any) => c?.baaziinNer === dbNer && c?.kholbolt) || null;
}

async function kholboltBelenBolokh(kholbolt: any, khugatsaa = 10000) {
  if (!kholbolt || kholbolt.readyState === 1) return;
  if (kholbolt.readyState !== 2) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, khugatsaa);
    kholbolt.once?.("connected", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function olokh(baiguullagiinId: string): Promise<any> {
  const mainConn = db.erunkhiiKholbolt?.kholbolt;
  if (!mainConn) {
    console.error("[tureesKholbolt] Ерөнхий холболт (erunkhiiKholbolt) алга");
    return null;
  }

  const baaziinMedeelel = mainConn.collection("baaziinMedeelel");
  const tokhirgoo = await baaziinMedeelel.findOne({
    baiguullagiinId: idAsuulga(baiguullagiinId),
    fsmEsekh: { $ne: true },
  });

  const dbNer = tokhirgoo?.baaz || tokhirgoo?.baaziinNer;
  if (!dbNer) {
    console.error(
      `[tureesKholbolt] ${baiguullagiinId}: baaziinMedeelel-д үндсэн (fsmEsekh-гүй) бааз бүртгэлгүй байна`,
    );
    return null;
  }

  // Хамгаалалт: үндсэн бааз нь FSM баазтай ижил нэртэй бол бичихгүй.
  const fsmTokhirgoonuud = await baaziinMedeelel
    .find({ baiguullagiinId: idAsuulga(baiguullagiinId), fsmEsekh: true })
    .toArray();
  if (fsmTokhirgoonuud.some((f: any) => (f.baaziinNer || f.baaz) === dbNer)) {
    console.error(
      `[tureesKholbolt] ${baiguullagiinId}: үндсэн бааз (${dbNer}) нь FSM баазтай ижил байна — алгаслаа`,
    );
    return null;
  }

  // OrgId-аар биш баазын нэрээр хайна — FSM-ийн холболт ч ижил orgId-тай
  // бүртгэгдсэн байж болно.
  let kholbolt = burtgelees(dbNer);

  if (!kholbolt) {
    // fsmConnection.ts-ийн FSM баазуудыг нээдэгтэй ижил аргаар нээнэ.
    await db.kholboltNemye(
      tokhirgoo.baiguullagiinId?.toString() || baiguullagiinId,
      dbNer,
      tokhirgoo.cloudMongoDBEsekh,
      tokhirgoo.clusterUrl,
      tokhirgoo.password,
      tokhirgoo.userName,
    );
    await new Promise((r) => setTimeout(r, 100));
    kholbolt = burtgelees(dbNer);
  }

  if (!kholbolt) {
    console.error(`[tureesKholbolt] ${baiguullagiinId}: ${dbNer} баазын холболт нээгдсэнгүй`);
    return null;
  }

  await kholboltBelenBolokh(kholbolt.kholbolt);
  return kholbolt;
}

/**
 * Байгууллагын үндсэн turees баазын холболт (`{ kholbolt, baaziinNer, ... }`).
 * Олдохгүй бол `null` — дуудагч тал FSM баазад бичихгүйгээр алгасах ёстой.
 */
export async function tureesKholboltAvakh(baiguullagiinId: any): Promise<any> {
  const id = String(baiguullagiinId ?? "").trim();
  if (!id) return null;

  const keshlesen = kesh.get(id);
  if (keshlesen?.kholbolt && keshlesen.kholbolt.readyState !== 0) return keshlesen;

  // Нэг байгууллагын зэрэг ирсэн хүсэлтүүд холболтыг давхар нээхгүй.
  let amlalt = khuleegdejBui.get(id);
  if (!amlalt) {
    amlalt = olokh(id).finally(() => khuleegdejBui.delete(id));
    khuleegdejBui.set(id, amlalt);
  }

  try {
    const kholbolt = await amlalt;
    if (kholbolt) kesh.set(id, kholbolt);
    return kholbolt;
  } catch (err) {
    console.error(`[tureesKholbolt] ${id}: холболт олоход алдаа:`, err);
    return null;
  }
}
