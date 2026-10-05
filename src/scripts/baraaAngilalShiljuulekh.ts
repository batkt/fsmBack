// Нэг удаагийн скрипт: барааны ангиллыг fsmTurul бүртгэл рүү нэгтгэнэ.
//
//  1. `baraa.turul` болон `task.baraa[].type` дахь хуучин түлхүүрүүдийг
//     (tseverlegch/Цэвэрлэгч → Цэвэрлэгээ, ugaalgiin → Угаалгын,
//     ariutgagch → Ариутгагч, bagaj → Багаж, busad → Бусад) нэр болгоно.
//  2. Барилга бүрийн бараанд байгаа ангилал fsmTurul-д бүртгэлгүй бол үүсгэнэ.
//  3. Барилга бүрт «Бусад» ангилал байгаа эсэхийг баталгаажуулна.
//  4. `zoriulalt`-гүй хуучин fsmTurul бичлэгт "baraa" тавина.
//
// Ажиллуулах (fsmBack хавтаснаас, .env-д BAAZ тохируулсан байх):
//   npm run build
//   node dist/scripts/baraaAngilalShiljuulekh.js            # зөвхөн тайлан (dry-run)
//   node dist/scripts/baraaAngilalShiljuulekh.js --commit   # бодитоор өөрчлөх
//
// Давтан ажиллуулахад аюулгүй.

import dotenv from "dotenv";
import {
  KHUUCHIN_ANGILAL,
  UNDSEN_ANGILAL,
  angilalNerAvakh,
  nerNormchlokh,
} from "../utils/baraaAngilal";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");

dotenv.config();

const COMMIT = process.argv.includes("--commit");

// "Цэвэрлэгч" гэх мэт кирилл түлхүүрийг анхны (том үсэгтэй) хэлбэрээр нь ч хайна.
const KHUUCHIN_TULKHUURUUD: Record<string, string> = { ...KHUUCHIN_ANGILAL, "Цэвэрлэгч": "Цэвэрлэгээ" };

async function fsmKholboltNeekh(dbNer: string, sample: any) {
  let kholbolt = Array.isArray(db.kholboltuud)
    ? db.kholboltuud.find((c: any) => c.baaziinNer === dbNer)
    : null;
  if (!kholbolt) {
    await db.kholboltNemyeFSM(
      sample.baiguullagiinId || sample._id.toString(),
      dbNer,
      sample.cloudMongoDBEsekh,
      sample.clusterUrl,
      sample.password,
      sample.userName,
    );
    await new Promise((r) => setTimeout(r, 100));
    kholbolt = db.kholboltuud.find((c: any) => c.baaziinNer === dbNer);
  }
  if (kholbolt?.kholbolt && kholbolt.kholbolt.readyState !== 1) {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 10000);
      kholbolt.kholbolt.once?.("connected", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
  return kholbolt;
}

async function ajilluulakh() {
  const fakeApp = { use: () => {} };
  await db.kholboltUusgey(fakeApp, process.env.BAAZ);
  await new Promise((r) => setTimeout(r, 1000));

  const mainConn = db.erunkhiiKholbolt?.kholbolt;
  if (!mainConn) throw new Error("Ерөнхий холболт нээгдсэнгүй");

  console.log(COMMIT ? "=== COMMIT горим ===" : "=== DRY-RUN (өөрчлөхгүй). Бодитоор хийх бол --commit ===");

  const fsmTokhirgoo = await mainConn.collection("baaziinMedeelel").find({ fsmEsekh: true }).toArray();
  const dbGroups = new Map<string, any>();
  for (const t of fsmTokhirgoo) {
    const dbNer = t.baaziinNer || t.baaz;
    if (dbNer && !dbGroups.has(dbNer)) dbGroups.set(dbNer, t);
  }

  for (const [dbNer, sample] of dbGroups) {
    const kholbolt = await fsmKholboltNeekh(dbNer, sample);
    const conn = kholbolt?.kholboltFSM || kholbolt?.kholbolt;
    if (!conn) {
      console.error(`[${dbNer}] FSM холболт нээгдсэнгүй — алгаслаа`);
      continue;
    }
    console.log(`\n[${dbNer}]`);
    const baraaCol = conn.collection("baraa");
    const taskCol = conn.collection("task");
    const turulCol = conn.collection("fsmTurul");

    // 1. Хуучин түлхүүр → нэр
    for (const [tulkhuur, ner] of Object.entries(KHUUCHIN_TULKHUURUUD)) {
      const baraaToo = await baraaCol.countDocuments({ turul: tulkhuur });
      const taskToo = await taskCol.countDocuments({ "baraa.type": tulkhuur });
      if (baraaToo === 0 && taskToo === 0) continue;
      console.log(`  "${tulkhuur}" → "${ner}": ${baraaToo} бараа, ${taskToo} даалгавар`);
      if (!COMMIT) continue;
      await baraaCol.updateMany({ turul: tulkhuur }, { $set: { turul: ner } });
      await taskCol.updateMany(
        { "baraa.type": tulkhuur },
        { $set: { "baraa.$[e].type": ner } },
        { arrayFilters: [{ "e.type": tulkhuur }] },
      );
    }

    // 4. zoriulalt-гүй хуучин бичлэгүүд
    const zoriulaltgui = await turulCol.countDocuments({ zoriulalt: { $exists: false } });
    if (zoriulaltgui > 0) {
      console.log(`  ${zoriulaltgui} fsmTurul-д zoriulalt: "baraa" тавина`);
      if (COMMIT)
        await turulCol.updateMany({ zoriulalt: { $exists: false } }, { $set: { zoriulalt: "baraa" } });
    }

    // 2-3. Барилга бүрийн ангиллууд
    const baraaAngilal = await baraaCol
      .aggregate([
        { $group: { _id: { b: "$baiguullagiinId", br: "$barilgiinId", t: "$turul" } } },
      ])
      .toArray();
    const turuluud = await turulCol
      .find({ zoriulalt: { $in: ["baraa", null] } })
      .toArray();

    const barilguud = new Map<string, { baiguullagiinId: string; barilgiinId: string; neruud: Map<string, string> }>();
    const barilgaAvakh = (baiguullagiinId: any, barilgiinId: any) => {
      const key = `${baiguullagiinId}|${barilgiinId}`;
      if (!barilguud.has(key))
        barilguud.set(key, { baiguullagiinId: String(baiguullagiinId), barilgiinId: String(barilgiinId), neruud: new Map() });
      return barilguud.get(key)!;
    };
    for (const mur of baraaAngilal) {
      if (!mur._id?.b || !mur._id?.br) continue;
      const barilga = barilgaAvakh(mur._id.b, mur._id.br);
      const ner = angilalNerAvakh(mur._id.t);
      if (ner) barilga.neruud.set(nerNormchlokh(ner), ner);
    }
    for (const t of turuluud) {
      if (t.baiguullagiinId && t.barilgiinId) barilgaAvakh(t.baiguullagiinId, t.barilgiinId);
    }

    for (const barilga of barilguud.values()) {
      const baigaa = turuluud.filter(
        (t: any) => String(t.baiguullagiinId) === barilga.baiguullagiinId && String(t.barilgiinId) === barilga.barilgiinId,
      );
      const baigaaNeruud = new Set(baigaa.map((t: any) => nerNormchlokh(t.ner)));
      barilga.neruud.set(nerNormchlokh(UNDSEN_ANGILAL), UNDSEN_ANGILAL);

      let erembe = baigaa.reduce((max: number, t: any) => Math.max(max, Number(t.erembe) || 0), 0);
      const nemekh: any[] = [];
      for (const [norm, ner] of barilga.neruud) {
        if (baigaaNeruud.has(norm)) continue;
        erembe += 1;
        nemekh.push({
          ner,
          zoriulalt: "baraa",
          ungu: "",
          erembe,
          baiguullagiinId: barilga.baiguullagiinId,
          barilgiinId: barilga.barilgiinId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      if (nemekh.length === 0) continue;
      console.log(
        `  ${barilga.baiguullagiinId} / ${barilga.barilgiinId}: шинэ ангилал → ${nemekh.map((n) => n.ner).join(", ")}`,
      );
      if (COMMIT) await turulCol.insertMany(nemekh);
    }
  }

  console.log("\nДууслаа.");
}

ajilluulakh()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Скрипт алдаа:", err);
    process.exit(1);
  });
