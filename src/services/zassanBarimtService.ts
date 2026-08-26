import { ensureFsmConn } from "../utils/fsmConn";
const getZassanBarimtModel = require("../models/zassanBarimt");

// Fields worth surfacing as an "edit" in the shared zassanTuukh page.
// Internal/system fields (taskId, timestamps, per-employee time logs,
// uploaded images, ratings set by other flows, etc.) are left out on
// purpose so the diff stays readable.
const DAALGAVAR_TALBAR: Record<string, string> = {
  ner: "Нэр",
  tailbar: "Тайлбар",
  zereglel: "Зэрэглэл",
  tuluv: "Төлөв",
  hariutsagchId: "Хариуцагч",
  ajiltnuud: "Ажилтнууд",
  ekhlekhTsag: "Эхлэх цаг",
  duusakhTsag: "Дуусах цаг",
  ekhlekhOgnoo: "Эхлэх огноо",
  duusakhOgnoo: "Дуусах огноо",
  khugatsaaDuusakhOgnoo: "Хугацаа дуусах огноо",
  isLoop: "Давтагдах эсэх",
  isDay: "Бүтэн өдөр эсэх",
  loopWeekdaysOnly: "Зөвхөн ажлын өдөр давтах",
  color: "Өнгө",
  bairshil: "Байршил",
  davkhar: "Давхар",
  baraa: "Ашигласан материал",
  // Төлөвлөгөө (project) дээр л тохиолддог талбарууд.
  udirdagchId: "Удирдагч",
  uilchluulegchId: "Үйлчлүүлэгч",
};

const BARAA_TALBAR: Record<string, string> = {
  ner: "Нэр",
  turul: "Төрөл",
  negj: "Хэмжих нэгж",
  uldegdel: "Үлдэгдэл",
  shirhegiinToo: "Хайрцаг доторх ширхэг",
};

const DED_DAALGAVAR_TALBAR: Record<string, string> = {
  ner: "Нэр",
  duussan: "Дууссан эсэх",
};

const UILCHLUULEGCH_TALBAR: Record<string, string> = {
  ner: "Нэр",
  register: "Регистр",
  mail: "И-мэйл",
  utas: "Утас",
  khayag: "Хаяг",
  tuluv: "Төлөв",
  tailbar: "Тайлбар",
  gereeNomer: "Гэрээний дугаар",
  gereeEkhlekh: "Гэрээ эхлэх",
  gereeDuusakh: "Гэрээ дуусах",
};

/**
 * Which fields each FSM record type contributes to the diff. Anything not
 * listed here is treated as internal and never shows up as an edit — KPI
 * counters, timestamps and connection plumbing would otherwise drown the
 * real change.
 */
const TALBAR_ANGILAL: Record<string, Record<string, string>> = {
  FsmTask: DAALGAVAR_TALBAR,
  FsmProject: DAALGAVAR_TALBAR,
  FsmBaraa: BARAA_TALBAR,
  FsmSubTask: DED_DAALGAVAR_TALBAR,
  FsmUilchluulegch: UILCHLUULEGCH_TALBAR,
};

/** Human-readable label written onto every record of a given type. */
export const FSM_ANGILAL_NER: Record<string, string> = {
  FsmTask: "Даалгавар (FSM)",
  FsmProject: "Төлөвлөгөө (FSM)",
  FsmBaraa: "Бараа материал (FSM)",
  FsmSubTask: "Дэд даалгавар (FSM)",
  FsmUilchluulegch: "Үйлчлүүлэгч (FSM)",
};

/** Every classType FSM writes — the "FSM" filter on Зассан түүх uses this. */
export const FSM_ANGILALUUD = Object.keys(FSM_ANGILAL_NER);

function orchuulyaText(talbaruud: Record<string, string>, key: string) {
  return talbaruud[key] || key;
}

function utgaUurchlukh(value: any): string {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function utganiiTurulOlokh(value: any): string {
  if (value instanceof Date) return "date";
  if (Array.isArray(value) || (value && typeof value === "object")) return "object";
  return typeof value;
}

export interface ZassanBarimtOruulga {
  khuuchin: any;
  shine: any;
  classType: string;
  className?: string;
  ajiltniiId?: string;
  ajiltniiNer?: string;
  conn: any;
  // Засварын шалтгаан. tureesBack-ийн зассан түүхтэй ижилхэн `shaltgaan`
  // талбарт бичигдэж, "Зассан түүх" хуудсанд харагдана.
  shaltgaan?: string;
}

/**
 * Diffs the whitelisted fields of an FSM record and, if anything changed,
 * writes a zassanBarimt into the org's DB so the edit shows up in
 * tureesBack's "Зассан түүх" page.
 *
 * Every FSM PUT handler calls this. A missing `khuuchin` (the pre-update
 * copy) used to make the whole thing a silent no-op, which is exactly how an
 * edit could save fine while leaving no trace — it is logged now.
 */
export async function fsmZassanBarimtBurtgekh({
  khuuchin,
  shine,
  classType,
  className,
  ajiltniiId,
  ajiltniiNer,
  conn,
  shaltgaan,
}: ZassanBarimtOruulga) {
  if (!khuuchin || !shine) {
    console.warn(
      `[zassanBarimt] ${classType}: засварын өмнөх/дараах утга дутуу тул түүх бичигдсэнгүй`,
    );
    return;
  }

  const talbaruud = TALBAR_ANGILAL[classType] || DAALGAVAR_TALBAR;
  const uurchlult: any[] = [];
  for (const key of Object.keys(talbaruud)) {
    const umnukh = khuuchin[key];
    const shineUtga = shine[key];
    if (shineUtga === undefined) continue;
    if (JSON.stringify(umnukh) === JSON.stringify(shineUtga)) continue;

    uurchlult.push({
      talbar: key,
      talbarNer: orchuulyaText(talbaruud, key),
      umnukhUtga: utgaUurchlukh(umnukh),
      shineUtga: utgaUurchlukh(shineUtga),
      utganiiTurul: utganiiTurulOlokh(shineUtga ?? umnukh),
    });
  }

  if (uurchlult.length === 0) return;

  try {
    const baseConn = ensureFsmConn(conn);
    const ZassanBarimt = getZassanBarimtModel(baseConn);
    await ZassanBarimt.create({
      baiguullagiinId: khuuchin.baiguullagiinId || shine.baiguullagiinId,
      barilgiinId: khuuchin.barilgiinId || shine.barilgiinId,
      classId: khuuchin._id,
      classDugaar:
        shine.taskId ||
        khuuchin.taskId ||
        shine.dugaar ||
        khuuchin.dugaar ||
        shine.ner ||
        khuuchin.ner,
      classOgnoo: khuuchin.createdAt,
      classType,
      className: className || FSM_ANGILAL_NER[classType] || classType,
      uurchlult,
      ajiltniiId,
      ajiltniiNer,
      shaltgaan,
    });
  } catch (e) {
    console.error(`[zassanBarimt] ${classType} бичихэд алдаа:`, e);
  }
}
