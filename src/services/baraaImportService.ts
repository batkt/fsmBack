import mongoose from "mongoose";
import { ensureFsmConn } from "../utils/fsmConn";
import {
  BARAA_ZORIULALT_QUERY,
  UNDSEN_ANGILAL,
  angilalNerAvakh,
  nerNormchlokh,
} from "../utils/baraaAngilal";
import { baraaIncomeNemekh } from "./baraaService";
import { angilalOlokhEsvelUusgekh } from "./fsmTurulService";
const getBaraaModel = require("../models/baraa");
const getTurulModel = require("../models/fsmTurul");

// Бараа материалыг Excel-ээс оруулах.
//
// Урсгал: frontend Excel-ийг өөрөө уншаад мөрүүдийг илгээнэ →
//   1) dryRun: true  — зөвхөн шалгаж, мөр бүрийн төлөвийг буцаана;
//   2) dryRun: false — алдаагүй бол бүгдийг нь оруулна (алдаатай мөр нэг ч
//      байвал юу ч хийхгүй).
// Бүртгэлтэй барааны нэр, ангилал, нэгжийг ХЭЗЭЭ Ч өөрчлөхгүй — зөвхөн орлого
// нэмнэ. Шинэ барааг үлдэгдэл 0-оор үүсгээд дараа нь орлого бичдэг тул орлогын
// түүхэнд ч харагдана.

export const IMPORT_KHYAZGAAR = 1000;

const NEGJ_KHURVUULEKH: Record<string, string> = {
  "ширхэг": "shirheg",
  "ш": "shirheg",
  "литр": "litr",
  "л": "litr",
  "кг": "kg",
  "килограмм": "kg",
  "хайрцаг": "haire",
  "богц": "bogts",
  "дан": "dana",
  shirheg: "shirheg",
  litr: "litr",
  kg: "kg",
  haire: "haire",
  bogts: "bogts",
  dana: "dana",
};

const NEGJ_NER: Record<string, string> = {
  shirheg: "Ширхэг",
  litr: "Литр",
  kg: "Кг",
  haire: "Хайрцаг",
  bogts: "Богц",
  dana: "Дан",
};

export type ImportTuluv = "shine" | "orlogo" | "algasakh" | "aldaa";

export interface ImportMur {
  mur: number;
  tuluv: ImportTuluv;
  aldaa: string;
  ner: string;
  negj: string;
  angilal: string;
  shineAngilal: boolean;
  too: number;
  khairtsag: number;
  zadgai: number;
}

interface ImportOruulga {
  rows: any[];
  fileNer?: string;
  dryRun: boolean;
  baiguullagiinId: string;
  barilgiinId: string;
  ajiltniiId?: string;
  ajiltniiNer?: string;
}

function khoosonEsekh(utga: any) {
  return utga === undefined || utga === null || String(utga).trim() === "";
}

/** Нүдний утгыг тоо болгоно. Хоосон бол null, тоо биш бол NaN. */
function toogoorAvakh(utga: any): number | null {
  if (khoosonEsekh(utga)) return null;
  if (typeof utga === "number") return utga;
  const tsever = String(utga).trim().replace(/\s/g, "").replace(",", ".");
  const too = Number(tsever);
  return Number.isFinite(too) ? too : NaN;
}

function ognooAvakh(utga: any): Date | null | "buruu" {
  if (khoosonEsekh(utga)) return null;
  const tekst = String(utga).trim();
  const taarsan = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/.exec(tekst);
  const ognoo = taarsan
    ? new Date(Number(taarsan[1]), Number(taarsan[2]) - 1, Number(taarsan[3]))
    : new Date(utga);
  return Number.isNaN(ognoo.getTime()) ? "buruu" : ognoo;
}

export async function baraaExceleesOruulakh(oruulga: ImportOruulga, conn: any) {
  const { rows, dryRun, baiguullagiinId, barilgiinId } = oruulga;
  const baseConn = ensureFsmConn(conn);
  const BaraaModel = getBaraaModel(baseConn, true);
  const TurulModel = getTurulModel(baseConn);

  const [baraanuud, angilaluud] = await Promise.all([
    BaraaModel.find({ baiguullagiinId, barilgiinId }).lean(),
    TurulModel.find({ baiguullagiinId, barilgiinId, zoriulalt: BARAA_ZORIULALT_QUERY }).lean(),
  ]);

  // нэр|нэгж → бараа, нэр → бүртгэлтэй нэгжүүд
  const baraaMap = new Map<string, any>();
  const nerNegjuud = new Map<string, Set<string>>();
  for (const b of baraanuud) {
    const ner = nerNormchlokh(b.ner);
    const negj = b.negj || "shirheg";
    if (!baraaMap.has(`${ner}|${negj}`)) baraaMap.set(`${ner}|${negj}`, b);
    if (!nerNegjuud.has(ner)) nerNegjuud.set(ner, new Set());
    nerNegjuud.get(ner)!.add(negj);
  }

  const angilalMap = new Map<string, string>();
  for (const a of angilaluud) angilalMap.set(nerNormchlokh(a.ner), a.ner);

  // Энэ файлд шинээр үүсэх бараа (нэр → нэгж), ангилал
  const fileShineBaraa = new Map<string, string>();
  const shineAngilaluud = new Map<string, string>();

  const murnuud: ImportMur[] = rows.map((row: any, i: number) => {
    const aldaanuud: string[] = [];
    const mur = Number(row?.mur) || i + 2;
    const ner = String(row?.ner ?? "").trim().replace(/\s+/g, " ");
    const negjTekst = String(row?.negj ?? "").trim();
    const negj = NEGJ_KHURVUULEKH[negjTekst.toLowerCase()] || "";

    if (!ner) aldaanuud.push("Барааны нэр хоосон");
    if (!negjTekst) aldaanuud.push("Хэмжих нэгж хоосон");
    else if (!negj) aldaanuud.push(`Хэмжих нэгж буруу: "${negjTekst}"`);

    const tooTalbar = (key: string, talbarNer: string) => {
      const utga = toogoorAvakh(row?.[key]);
      if (utga === null) return null;
      if (Number.isNaN(utga)) {
        aldaanuud.push(`${talbarNer} тоо биш байна`);
        return null;
      }
      if (utga < 0) {
        aldaanuud.push(`${talbarNer} сөрөг байж болохгүй`);
        return null;
      }
      return utga;
    };

    const tooUtga = tooTalbar("too", "Тоо хэмжээ");
    const khairtsagUtga = tooTalbar("khairtsag", "Хайрцаг");
    const zadgaiUtga = tooTalbar("zadgai", "Задгай");
    const shirhegUtga = tooTalbar("shirhegiinToo", "Хайрцаг дахь ширхэг");
    tooTalbar("une", "Нэгж үнэ");

    const ognoo = ognooAvakh(row?.ognoo);
    if (ognoo === "buruu") aldaanuud.push(`Огноо буруу: "${row?.ognoo}"`);

    const norm = nerNormchlokh(ner);
    let baigaa = ner && negj ? baraaMap.get(`${norm}|${negj}`) : null;

    // Ижил нэртэй бараа өөр нэгжээр бүртгэлтэй / файлд байвал алдаа.
    if (ner && negj && !baigaa) {
      const negjuud = nerNegjuud.get(norm);
      if (negjuud && negjuud.size > 0) {
        aldaanuud.push(
          `"${ner}" нэртэй бараа өөр нэгжээр (${Array.from(negjuud).map((n) => NEGJ_NER[n] || n).join(", ")}) бүртгэлтэй байна`,
        );
      } else if (fileShineBaraa.has(norm) && fileShineBaraa.get(norm) !== negj) {
        aldaanuud.push(`"${ner}" нэртэй бараа файлд өөр нэгжээр давхардсан байна`);
      }
    }

    let too = 0;
    let khairtsag = 0;
    let zadgai = 0;
    if (negj === "haire") {
      const shirhegiinToo = baigaa ? baigaa.shirhegiinToo || 1 : shirhegUtga;
      if (!baigaa) {
        if (shirhegUtga === null || shirhegUtga < 1 || !Number.isInteger(shirhegUtga))
          aldaanuud.push("Хайрцагтай бараанд «Хайрцаг дахь ширхэг» 1-ээс багагүй бүхэл тоо байна");
      } else if (shirhegUtga !== null && shirhegUtga !== (baigaa.shirhegiinToo || 1)) {
        aldaanuud.push(
          `Хайрцаг дахь ширхэг бүртгэлтэй утгатай (${baigaa.shirhegiinToo || 1}) таарахгүй байна`,
        );
      }
      if (tooUtga !== null && khairtsagUtga === null && zadgaiUtga === null) {
        aldaanuud.push("Хайрцагтай бараанд «Хайрцаг», «Задгай» баганыг бөглөнө үү");
      }
      khairtsag = khairtsagUtga || 0;
      zadgai = zadgaiUtga || 0;
      if (!Number.isInteger(khairtsag)) aldaanuud.push("Хайрцаг бүхэл тоо байна");
      if (!Number.isInteger(zadgai)) aldaanuud.push("Задгай бүхэл тоо байна");
      if (shirhegiinToo && shirhegiinToo >= 1) {
        if (zadgai >= shirhegiinToo)
          aldaanuud.push(`Задгай ширхэг хайрцаг дахь ширхэгээс (${shirhegiinToo}) бага байна`);
        too = khairtsag + zadgai / shirhegiinToo;
      }
    } else {
      if (khairtsagUtga || zadgaiUtga)
        aldaanuud.push("«Хайрцаг», «Задгай» баганыг зөвхөн Хайрцаг нэгжтэй бараанд бөглөнө");
      too = tooUtga || 0;
      if (negj === "shirheg" && !Number.isInteger(too)) aldaanuud.push("Ширхэгийн тоо бүхэл байна");
    }

    // Ангилал — зөвхөн шинэ бараанд хэрэглэгдэнэ.
    let angilal = "";
    let shineAngilal = false;
    if (!baigaa) {
      const angilalNer = angilalNerAvakh(row?.angilal) || UNDSEN_ANGILAL;
      const angilalNorm = nerNormchlokh(angilalNer);
      angilal = angilalMap.get(angilalNorm) || shineAngilaluud.get(angilalNorm) || angilalNer;
      if (!angilalMap.has(angilalNorm)) {
        shineAngilal = true;
        if (aldaanuud.length === 0) shineAngilaluud.set(angilalNorm, angilal);
      }
    } else {
      angilal = angilalNerAvakh(baigaa.turul);
    }

    let tuluv: ImportTuluv;
    if (aldaanuud.length > 0) tuluv = "aldaa";
    else if (baigaa) tuluv = too > 0 ? "orlogo" : "algasakh";
    else if (fileShineBaraa.has(norm)) tuluv = too > 0 ? "orlogo" : "algasakh";
    else {
      tuluv = "shine";
      fileShineBaraa.set(norm, negj);
    }

    return {
      mur,
      tuluv,
      aldaa: aldaanuud.join("; "),
      ner,
      negj,
      angilal,
      shineAngilal,
      too,
      khairtsag,
      zadgai,
    };
  });

  const dun = {
    shine: murnuud.filter((m) => m.tuluv === "shine").length,
    orlogo: murnuud.filter((m) => m.tuluv === "orlogo").length,
    shineAngilal: shineAngilaluud.size,
    aldaa: murnuud.filter((m) => m.tuluv === "aldaa").length,
  };

  if (dryRun || dun.aldaa > 0) {
    return { dun, murnuud, khadgalsan: false };
  }

  // ── Хадгалах ──────────────────────────────────────────────────────────
  const importId = new mongoose.Types.ObjectId().toString();
  const tailbarUndsen = `Excel импорт: ${oruulga.fileNer || "файл"}`;

  const angilalNer = new Map<string, string>();
  for (const [norm, ner] of shineAngilaluud) {
    angilalNer.set(norm, await angilalOlokhEsvelUusgekh(ner, baiguullagiinId, barilgiinId, baseConn));
  }

  const uusgesen = new Map<string, any>();
  for (let i = 0; i < murnuud.length; i++) {
    const m = murnuud[i]!;
    const row = rows[i] || {};
    // Тоо хэмжээгүй, аль хэдийн байгаа (эсвэл энэ файлд үүссэн) бараа.
    if (m.tuluv === "algasakh") continue;

    try {
      const key = `${nerNormchlokh(m.ner)}|${m.negj}`;
      let baraa = baraaMap.get(key) || uusgesen.get(key);
      if (!baraa) {
        baraa = await BaraaModel.create({
          ner: m.ner,
          turul: angilalNer.get(nerNormchlokh(m.angilal)) || m.angilal || UNDSEN_ANGILAL,
          negj: m.negj,
          uldegdel: 0,
          shirhegiinToo: m.negj === "haire" ? Number(toogoorAvakh(row.shirhegiinToo)) || 1 : 1,
          baiguullagiinId,
          barilgiinId,
        });
        uusgesen.set(key, baraa);
      }

      if (m.too > 0) {
        const ognoo = ognooAvakh(row.ognoo);
        const une = toogoorAvakh(row.une);
        const nemelt: any = {
          khairtsag: m.khairtsag,
          zadgai: m.zadgai,
          ekhSurvalj: "excel",
          importId,
          ajiltniiId: oruulga.ajiltniiId || "",
          ajiltniiNer: oruulga.ajiltniiNer || "",
        };
        if (une !== null && !Number.isNaN(une)) nemelt.une = une;
        await baraaIncomeNemekh(
          String(baraa._id),
          m.too,
          String(row.tailbar ?? "").trim() || tailbarUndsen,
          ognoo instanceof Date ? ognoo : undefined,
          baseConn,
          nemelt,
        );
      }
    } catch (err: any) {
      console.error(`[baraaImport] ${m.mur}-р мөр оруулахад алдаа:`, err);
      m.tuluv = "aldaa";
      m.aldaa = err?.message || "Хадгалахад алдаа гарлаа";
    }
  }

  dun.aldaa = murnuud.filter((m) => m.tuluv === "aldaa").length;
  return { dun, murnuud, khadgalsan: true, importId };
}
