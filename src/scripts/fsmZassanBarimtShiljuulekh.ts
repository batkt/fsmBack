// Нэг удаагийн скрипт: FSM баазуудад андуурч бичигдсэн Fsm* zassanBarimt-ыг
// байгууллагын үндсэн (turees) бааз руу шилжүүлнэ.
//
// Өмнө нь fsmZassanBarimtBurtgekh нь `req.tukhainBaaziinKholbolt`-оор (FSM
// бааз) бичдэг байсан тул tureesBack-ийн "Зассан түүх" хуудсанд харагддаггүй
// байв. Энэ скрипт тэдгээрийг зөв бааз руу хуулж, FSM баазаас устгана.
//
// Ажиллуулах (fsmBack хавтаснаас, .env-д BAAZ тохируулсан байх):
//   npm run build
//   node dist/scripts/fsmZassanBarimtShiljuulekh.js            # зөвхөн тайлан (dry-run)
//   node dist/scripts/fsmZassanBarimtShiljuulekh.js --commit   # бодитоор шилжүүлэх
//
// Давтан ажиллуулахад аюулгүй: turees баазад ижил _id-тай бичлэг байвал дахин
// хуулахгүй, зөвхөн FSM баазаас нь устгана.

import dotenv from "dotenv";
import { tureesKholboltAvakh } from "../utils/tureesKholbolt";
import { FSM_ANGILALUUD } from "../services/zassanBarimtService";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");

dotenv.config();

const COMMIT = process.argv.includes("--commit");

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
  const dbGroups = new Map<string, any[]>();
  for (const t of fsmTokhirgoo) {
    const dbNer = t.baaziinNer || t.baaz;
    if (!dbNer) continue;
    if (!dbGroups.has(dbNer)) dbGroups.set(dbNer, []);
    dbGroups.get(dbNer)!.push(t);
  }

  let niitOlson = 0;
  let niitKhuulsan = 0;
  let niitBaisan = 0;
  let niitUstgasan = 0;
  let niitAlgassan = 0;

  for (const [dbNer, tokhirgoonuud] of dbGroups) {
    const fsmKholbolt = await fsmKholboltNeekh(dbNer, tokhirgoonuud[0]);
    if (!fsmKholbolt?.kholbolt) {
      console.error(`[${dbNer}] FSM холболт нээгдсэнгүй — алгаслаа`);
      continue;
    }
    // FSM баазын kholbolt === kholboltFSM.
    const fsmCol = (fsmKholbolt.kholboltFSM || fsmKholbolt.kholbolt).collection("zassanBarimt");
    const barimtuud = await fsmCol.find({ classType: { $in: FSM_ANGILALUUD } }).toArray();
    niitOlson += barimtuud.length;
    console.log(`[${dbNer}] ${barimtuud.length} Fsm* зассан баримт олдлоо`);
    if (barimtuud.length === 0) continue;

    // Байгууллагаар бүлэглэнэ.
    const baiguullagaar = new Map<string, any[]>();
    for (const b of barimtuud) {
      const id = String(b.baiguullagiinId || "");
      if (!baiguullagaar.has(id)) baiguullagaar.set(id, []);
      baiguullagaar.get(id)!.push(b);
    }

    for (const [baiguullagiinId, jagsaalt] of baiguullagaar) {
      const tureesKholbolt = baiguullagiinId ? await tureesKholboltAvakh(baiguullagiinId) : null;
      if (!tureesKholbolt?.kholbolt) {
        console.error(`  [${baiguullagiinId || "—"}] turees бааз олдсонгүй — ${jagsaalt.length} бичлэг алгаслаа`);
        niitAlgassan += jagsaalt.length;
        continue;
      }
      if (tureesKholbolt.kholbolt === (fsmKholbolt.kholboltFSM || fsmKholbolt.kholbolt)) {
        console.error(`  [${baiguullagiinId}] turees бааз нь FSM баазтай ижил — алгаслаа`);
        niitAlgassan += jagsaalt.length;
        continue;
      }

      const tureesCol = tureesKholbolt.kholbolt.collection("zassanBarimt");
      const ids = jagsaalt.map((b) => b._id);
      const baigaaIds = new Set(
        (await tureesCol.find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray()).map((d: any) =>
          String(d._id),
        ),
      );
      const shine = jagsaalt.filter((b) => !baigaaIds.has(String(b._id)));
      niitBaisan += baigaaIds.size;

      console.log(
        `  [${baiguullagiinId}] → ${tureesKholbolt.baaziinNer}: ${shine.length} хуулна, ${baigaaIds.size} аль хэдийн байгаа`,
      );

      if (!COMMIT) continue;

      if (shine.length > 0) {
        await tureesCol.insertMany(shine, { ordered: false });
        niitKhuulsan += shine.length;
      }
      // Зорилтот баазад байгаа нь баталгаажсан бичлэгүүдийг л устгана.
      const batalgaajsan = (
        await tureesCol.find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray()
      ).map((d: any) => d._id);
      if (batalgaajsan.length > 0) {
        const ur = await fsmCol.deleteMany({ _id: { $in: batalgaajsan } });
        niitUstgasan += ur?.deletedCount || 0;
      }
    }
  }

  console.log("\n=== Дүн ===");
  console.log(`Олдсон: ${niitOlson}`);
  console.log(`turees-д аль хэдийн байсан: ${niitBaisan}`);
  console.log(`Алгассан (turees бааз олдоогүй): ${niitAlgassan}`);
  if (COMMIT) {
    console.log(`Хуулсан: ${niitKhuulsan}`);
    console.log(`FSM баазаас устгасан: ${niitUstgasan}`);
  }
}

ajilluulakh()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Скрипт алдаа:", err);
    process.exit(1);
  });
