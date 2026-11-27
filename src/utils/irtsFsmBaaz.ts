import { loadAllFsmConnections } from "./fsmConnection";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");

// irtsWeb (irts.zevtabs.mn)-ийн байгууллага анх удаа FSM-д хандахад өөрийн
// шинэ, хоосон FSM баазыг автоматаар бүртгэж нээнэ. turees-ийн FSM баазтай огт
// холбогдохгүй — ажилтан нь irts-ийн ajiltan (IRTS_MONGODB_URI)-аас ирнэ.
// Нэр: fsm_irts_<baiguullagiinId> (turees-ийн баазтай давхцахгүй).

const khuleegdejBui = new Map<string, Promise<any>>();

export const irtsFsmBaaziinNer = (baiguullagiinId: string) => `fsm_irts_${baiguullagiinId}`;

function burtgeltee(orgId: string) {
  if (!Array.isArray(db.kholboltuud)) return null;
  return db.kholboltuud.find((c: any) => c?.orgIds && c.orgIds.has(orgId)) || null;
}

async function uusgekh(orgId: string): Promise<any> {
  const mainConn = db.erunkhiiKholbolt?.kholbolt;
  if (!mainConn) throw new Error("Ерөнхий холболт (erunkhiiKholbolt) алга");
  const baaziinMedeelel = mainConn.collection("baaziinMedeelel");

  const mur = await baaziinMedeelel.findOne({ baiguullagiinId: orgId, fsmEsekh: true });
  if (!mur) {
    const baaziinNer = irtsFsmBaaziinNer(orgId);
    console.log(`[irtsFsmBaaz] ${orgId}: шинэ FSM бааз бүртгэж байна (${baaziinNer})`);
    // Зөвхөн бүртгэлийн мөр — бааз нь үндсэн MongoDB дээр анхны бичилтээр
    // үүснэ; холболтыг loadAllFsmConnections (useDb) нээнэ.
    try {
      await baaziinMedeelel.insertOne({
        baiguullagiinId: orgId,
        baaziinNer,
        fsmEsekh: true,
        irtsEsekh: true,
        createdAt: new Date(),
      });
    } catch (err: any) {
      // Зэрэг ирсэн хүсэлт аль хэдийн нэмсэн бол (unique индекс) зүгээр
      if (err?.code !== 11000) throw err;
    }
  }
  await loadAllFsmConnections();
  return burtgeltee(orgId);
}

/** irts байгууллагын FSM холболт — байхгүй бол шинээр үүсгэнэ. */
export async function irtsFsmKholboltBelden(baiguullagiinId: any): Promise<any> {
  const orgId = String(baiguullagiinId ?? "").trim();
  if (!orgId) return null;
  const baigaa = burtgeltee(orgId);
  if (baigaa) return baigaa;

  let amlalt = khuleegdejBui.get(orgId);
  if (!amlalt) {
    amlalt = uusgekh(orgId).finally(() => khuleegdejBui.delete(orgId));
    khuleegdejBui.set(orgId, amlalt);
  }
  try {
    return await amlalt;
  } catch (err: any) {
    console.error(`[irtsFsmBaaz] ${orgId}: FSM бааз үүсгэж чадсангүй:`, err?.message || err);
    return null;
  }
}
