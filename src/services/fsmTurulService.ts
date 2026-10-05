import { ensureFsmConn } from "../utils/fsmConn";
import {
  BARAA_ZORIULALT_QUERY,
  UNDSEN_ANGILAL,
  angilalNerAvakh,
  angilalTulkhuuruud,
  nerNormchlokh,
  nerRegex,
} from "../utils/baraaAngilal";
const getTurulModel = require("../models/fsmTurul");
const getBaraaModel = require("../models/baraa");
const getTaskModel = require("../models/task");

// HTTP статустай алдаа — controller тал `status`-ыг нь хариунд тавина.
export class TurulAldaa extends Error {
  status: number;
  nemelt: any;
  constructor(status: number, message: string, nemelt: any = {}) {
    super(message);
    this.status = status;
    this.nemelt = nemelt;
  }
}

const DAVKHTSSAN_NER = "Ийм нэртэй ангилал бүртгэлтэй байна";

function turulModel(fsmConn: any) {
  return getTurulModel(ensureFsmConn(fsmConn));
}

/** Тухайн ангилалд хамаарах `baraa.turul` утгуудын асуулга. */
function turulAsuulga(ner: string) {
  return { $in: [...angilalTulkhuuruud(ner), nerRegex(ner)] };
}

async function davkhardsanEsekh(
  TurulModel: any,
  baiguullagiinId: string,
  barilgiinId: string,
  ner: string,
  ooriinId?: string,
) {
  const query: any = {
    baiguullagiinId,
    barilgiinId,
    zoriulalt: BARAA_ZORIULALT_QUERY,
    ner: nerRegex(ner),
  };
  if (ooriinId) query._id = { $ne: ooriinId };
  return !!(await TurulModel.exists(query));
}

export const turulJagsaalt = async (
  query: any,
  fsmConn: any,
  songolt: { baraaToo?: boolean } = {},
) => {
  const TurulModel = turulModel(fsmConn);
  const asuulga = { zoriulalt: BARAA_ZORIULALT_QUERY, ...query };
  const turuls = await TurulModel.find(asuulga)
    .sort({ erembe: 1, createdAt: 1 })
    .lean();

  if (!songolt.baraaToo) return turuls;

  // Ангилал бүрийн барааны тоо. Хуучин түлхүүртэй бараа ч зөв ангилалдаа
  // тоологдоно.
  const baraaQuery: any = {};
  if (query.baiguullagiinId) baraaQuery.baiguullagiinId = query.baiguullagiinId;
  if (query.barilgiinId) baraaQuery.barilgiinId = query.barilgiinId;
  const toonuud = await getBaraaModel(ensureFsmConn(fsmConn), true).aggregate([
    { $match: baraaQuery },
    { $group: { _id: "$turul", too: { $sum: 1 } } },
  ]);
  const nerToo = new Map<string, number>();
  for (const mur of toonuud) {
    const key = nerNormchlokh(angilalNerAvakh(mur._id));
    nerToo.set(key, (nerToo.get(key) || 0) + (mur.too || 0));
  }

  return turuls.map((t: any) => ({
    ...t,
    baraaToo: nerToo.get(nerNormchlokh(t.ner)) || 0,
  }));
};

export const turulUusgekh = async (data: any, fsmConn: any) => {
  const TurulModel = turulModel(fsmConn);
  const ner = String(data?.ner ?? "").trim().replace(/\s+/g, " ");
  if (!ner) throw new TurulAldaa(400, "Ангиллын нэр оруулна уу");
  if (!data.baiguullagiinId || !data.barilgiinId)
    throw new TurulAldaa(400, "Байгууллага, барилга шаардлагатай");

  if (await davkhardsanEsekh(TurulModel, data.baiguullagiinId, data.barilgiinId, ner))
    throw new TurulAldaa(409, DAVKHTSSAN_NER);

  // Эрэмбэ өгөөгүй бол хамгийн сүүлд нэмнэ.
  let erembe = Number(data.erembe);
  if (!Number.isFinite(erembe)) {
    const suuliin = await TurulModel.findOne({
      baiguullagiinId: data.baiguullagiinId,
      barilgiinId: data.barilgiinId,
      zoriulalt: BARAA_ZORIULALT_QUERY,
    })
      .sort({ erembe: -1 })
      .lean();
    erembe = (Number(suuliin?.erembe) || 0) + 1;
  }

  const turul = new TurulModel({
    ner,
    zoriulalt: data.zoriulalt || "baraa",
    ungu: data.ungu || "",
    erembe,
    baiguullagiinId: data.baiguullagiinId,
    barilgiinId: data.barilgiinId,
  });
  return await turul.save();
};

/**
 * Ангилал засах. Нэр өөрчлөгдвөл тухайн барилгын бараа
 * (`baraa.turul`) болон даалгаврын ашигласан материалын (`task.baraa[].type`)
 * хуучин нэрийг шинэ нэрээр солино.
 */
export const turulZasakh = async (id: string, data: any, fsmConn: any) => {
  const baseConn = ensureFsmConn(fsmConn);
  const TurulModel = turulModel(baseConn);
  const khuuchin = await TurulModel.findById(id).lean();
  if (!khuuchin) return null;

  const shinechlekh: any = {};
  if (data.ungu !== undefined) shinechlekh.ungu = data.ungu || "";
  if (data.erembe !== undefined && Number.isFinite(Number(data.erembe)))
    shinechlekh.erembe = Number(data.erembe);

  let shineNer: string | null = null;
  if (data.ner !== undefined) {
    const ner = String(data.ner ?? "").trim().replace(/\s+/g, " ");
    if (!ner) throw new TurulAldaa(400, "Ангиллын нэр оруулна уу");
    if (ner !== khuuchin.ner) {
      if (
        await davkhardsanEsekh(TurulModel, khuuchin.baiguullagiinId, khuuchin.barilgiinId, ner, id)
      )
        throw new TurulAldaa(409, DAVKHTSSAN_NER);
      shinechlekh.ner = ner;
      shineNer = ner;
    }
  }

  const shine = await TurulModel.findByIdAndUpdate(id, shinechlekh, { new: true }).lean();

  if (shineNer) {
    await baraaShiljuulekh(baseConn, khuuchin, shineNer);
  }

  return shine;
};

/** `khuuchin` ангиллын бараа, даалгаврын материалыг `shineNer` рүү шилжүүлнэ. */
async function baraaShiljuulekh(baseConn: any, khuuchin: any, shineNer: string) {
  const baraaUr = await getBaraaModel(baseConn, true).updateMany(
    {
      baiguullagiinId: khuuchin.baiguullagiinId,
      barilgiinId: khuuchin.barilgiinId,
      turul: turulAsuulga(khuuchin.ner),
    },
    { $set: { turul: shineNer } },
  );

  // task.baraa[].type — тухайн үед сонгосон ангиллын нэр.
  try {
    await getTaskModel(baseConn, true).updateMany(
      {
        baiguullagiinId: khuuchin.baiguullagiinId,
        barilgiinId: khuuchin.barilgiinId,
        "baraa.type": turulAsuulga(khuuchin.ner),
      },
      { $set: { "baraa.$[e].type": shineNer } },
      { arrayFilters: [{ "e.type": turulAsuulga(khuuchin.ner) }] },
    );
  } catch (err) {
    console.error("[fsmTurul] Даалгаврын материалын ангилал шилжүүлэхэд алдаа:", err);
  }

  return baraaUr?.modifiedCount || 0;
}

/**
 * Ангилал устгах. Бараанд ашиглагдаж байвал 409 буцаана; `shiljuulekh`
 * өгсөн бол тэр ангилал руу (байхгүй бол үүсгээд) шилжүүлсний дараа устгана.
 */
export const turulUstgakh = async (
  id: string,
  fsmConn: any,
  shiljuulekh?: string,
) => {
  const baseConn = ensureFsmConn(fsmConn);
  const TurulModel = turulModel(baseConn);
  const turul = await TurulModel.findById(id).lean();
  if (!turul) return null;

  const baraaToo = await getBaraaModel(baseConn, true).countDocuments({
    baiguullagiinId: turul.baiguullagiinId,
    barilgiinId: turul.barilgiinId,
    turul: turulAsuulga(turul.ner),
  });

  if (baraaToo > 0) {
    const zorilt = String(shiljuulekh ?? "").trim();
    if (!zorilt) {
      throw new TurulAldaa(
        409,
        `Энэ ангилалд ${baraaToo} бараа бүртгэлтэй тул устгах боломжгүй`,
        { baraaToo },
      );
    }
    if (nerNormchlokh(zorilt) === nerNormchlokh(turul.ner))
      throw new TurulAldaa(400, "Өөр ангилал сонгоно уу");

    // Зорилтот ангиллыг бүртгэлээс олно (нэрийн бичлэгийг нь хэвээр авна),
    // байхгүй бол ("Бусад" гэх мэт) үүсгэнэ.
    let zoriltotTurul = await TurulModel.findOne({
      baiguullagiinId: turul.baiguullagiinId,
      barilgiinId: turul.barilgiinId,
      zoriulalt: BARAA_ZORIULALT_QUERY,
      ner: nerRegex(zorilt),
    }).lean();
    if (!zoriltotTurul) {
      zoriltotTurul = await turulUusgekh(
        {
          ner: zorilt,
          baiguullagiinId: turul.baiguullagiinId,
          barilgiinId: turul.barilgiinId,
        },
        baseConn,
      );
    }
    await baraaShiljuulekh(baseConn, turul, zoriltotTurul.ner);
  }

  return await TurulModel.findByIdAndDelete(id);
};

/**
 * Excel импорт зэрэгт: нэрээр нь ангилал олох, байхгүй бол үүсгэх.
 * Буцаах утга нь бүртгэлд байгаа (canonical) нэр.
 */
export const angilalOlokhEsvelUusgekh = async (
  ner: string,
  baiguullagiinId: string,
  barilgiinId: string,
  fsmConn: any,
): Promise<string> => {
  const TurulModel = turulModel(fsmConn);
  const tseverNer = angilalNerAvakh(ner) || UNDSEN_ANGILAL;
  const baigaa = await TurulModel.findOne({
    baiguullagiinId,
    barilgiinId,
    zoriulalt: BARAA_ZORIULALT_QUERY,
    ner: nerRegex(tseverNer),
  }).lean();
  if (baigaa) return baigaa.ner;
  const shine = await turulUusgekh({ ner: tseverNer, baiguullagiinId, barilgiinId }, fsmConn);
  return shine.ner;
};
