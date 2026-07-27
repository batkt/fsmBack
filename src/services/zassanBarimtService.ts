import { ensureFsmConn } from "../utils/fsmConn";
const getZassanBarimtModel = require("../models/zassanBarimt");

// Fields worth surfacing as an "edit" in the shared zassanTuukh page.
// Internal/system fields (taskId, timestamps, per-employee time logs,
// uploaded images, ratings set by other flows, etc.) are left out on
// purpose so the diff stays readable.
const TALBAR_NERSHIL: Record<string, string> = {
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
};

function orchuulyaText(key: string) {
  return TALBAR_NERSHIL[key] || key;
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

/**
 * Diffs the whitelisted task fields between oldTask/newTask and, if anything
 * changed, writes a zassanBarimt record into the org's shared DB so the
 * change shows up in tureesBack's "Зассан түүх" page.
 */
export async function taskZassanBarimtBurtgekh(
  oldTask: any,
  newTask: any,
  classType: string,
  className: string,
  ajiltniiId: string | undefined,
  ajiltniiNer: string | undefined,
  conn: any,
) {
  if (!oldTask || !newTask) return;

  const uurchlult: any[] = [];
  for (const key of Object.keys(TALBAR_NERSHIL)) {
    const umnukh = oldTask[key];
    const shine = newTask[key];
    if (shine === undefined) continue;
    if (JSON.stringify(umnukh) === JSON.stringify(shine)) continue;

    uurchlult.push({
      talbar: key,
      talbarNer: orchuulyaText(key),
      umnukhUtga: utgaUurchlukh(umnukh),
      shineUtga: utgaUurchlukh(shine),
      utganiiTurul: utganiiTurulOlokh(shine ?? umnukh),
    });
  }

  if (uurchlult.length === 0) return;

  try {
    const baseConn = ensureFsmConn(conn);
    const ZassanBarimt = getZassanBarimtModel(baseConn);
    await ZassanBarimt.create({
      baiguullagiinId: oldTask.baiguullagiinId,
      barilgiinId: oldTask.barilgiinId,
      classId: oldTask._id,
      classDugaar: newTask.taskId || oldTask.taskId || newTask.ner || oldTask.ner,
      classOgnoo: oldTask.createdAt,
      classType,
      className,
      uurchlult,
      ajiltniiId,
      ajiltniiNer,
    });
  } catch (e) {
    console.error("taskZassanBarimtBurtgekh алдаа:", e);
  }
}
