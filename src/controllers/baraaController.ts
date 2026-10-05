import { Response } from "express";
import {
  baraaJagsaalt,
  baraaUusgekh,
  baraaZasakh,
  baraaUstgakh,
  baraaNegAvakh,
  baraaAshiglalatStats,
  baraaAshiglalatTimeline,
  baraaIncomeNemekh,
  baraaOrlogiinTuukh,
} from "../services/baraaService";
import { baraaExceleesOruulakh, IMPORT_KHYAZGAAR } from "../services/baraaImportService";
import { getFsmConnFromReq } from "../utils/fsmConn";
import { fsmZassanBarimtBurtgekh } from "../services/zassanBarimtService";

export const getBaraas = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {};
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    if (bid) query.baiguullagiinId = bid;

    if (req.query.turul) query.turul = req.query.turul;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;
    if (req.query.idevhtei !== undefined) query.idevhtei = req.query.idevhtei === "true";

    const baraas = await baraaJagsaalt(query, getFsmConnFromReq(req));
    res.json({ success: true, data: baraas });
  } catch (err) {
    next(err);
  }
};

export const getBaraa = async (req: any, res: Response, next: any) => {
  try {
    const baraa = await baraaNegAvakh(req.params.id, getFsmConnFromReq(req));
    if (!baraa) return res.status(404).json({ success: false, message: "Бараа олдсонгүй" });
    res.json({ success: true, data: baraa });
  } catch (err) {
    next(err);
  }
};

export const createBaraa = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const data = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid })
    };
    const baraa = await baraaUusgekh(data, getFsmConnFromReq(req));
    
    // Emit socket event for real-time refresh
    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom("broadcast", "baraa_created", baraa);

    res.status(201).json({ success: true, data: baraa });
  } catch (err) {
    next(err);
  }
};

export const updateBaraa = async (req: any, res: Response, next: any) => {
  try {
    // Зассан түүх бичихийн тулд хуучин утгыг өмнө нь авна.
    const khuuchinBaraa = await baraaNegAvakh(req.params.id, getFsmConnFromReq(req));

    const baraa = await baraaZasakh(req.params.id, req.body, getFsmConnFromReq(req));
    if (!baraa) return res.status(404).json({ success: false, message: "Бараа олдсонгүй" });

    await fsmZassanBarimtBurtgekh({
      khuuchin: khuuchinBaraa,
      shine: baraa,
      classType: "FsmBaraa",
      ajiltniiId: req.ajiltan?.id,
      ajiltniiNer: req.ajiltan?.ner,
      conn: getFsmConnFromReq(req),
      shaltgaan: req.body?.shaltgaan,
    });

    // Emit socket event for real-time refresh
    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom("broadcast", "baraa_updated", baraa);

    res.json({ success: true, data: baraa });
  } catch (err) {
    next(err);
  }
};

export const deleteBaraa = async (req: any, res: Response, next: any) => {
  try {
    const baraa = await baraaUstgakh(req.params.id, getFsmConnFromReq(req));
    if (!baraa) return res.status(404).json({ success: false, message: "Бараа олдсонгүй" });
    
    // Emit socket event to refresh frontend charts and tables
    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom("broadcast", "baraa_deleted", { id: req.params.id });
    // Also trigger task updates as usage stats depend on baraa presence
    emitToRoom("broadcast", "task_updated", {});

    res.json({ success: true, message: "Бараа амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
export const getBaraaUsageStats = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    const barilgiinId = req.query.barilgiinId;
    const { startDate, endDate } = req.query;
    
    if (!bid || !barilgiinId) {
      return res.status(400).json({ success: false, message: "baiguullagiinId болон barilgiinId шаардлагатай" });
    }

    const sDate = startDate ? new Date(startDate as string) : undefined;
    const eDate = endDate ? new Date(endDate as string) : undefined;

    const stats = await baraaAshiglalatStats(bid, barilgiinId as string, sDate, eDate, getFsmConnFromReq(req));
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
export const getBaraaUsageTimeline = async (req: any, res: Response, next: any) => {
  try {
    const baiguullagiinId = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    const barilgiinId = req.query.barilgiinId;

    if (!barilgiinId) {
      return res.status(400).json({ success: false, message: "barilgiinId шаардлагатай" });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;

    const data = await baraaAshiglalatTimeline(baiguullagiinId, barilgiinId, startDate, endDate, getFsmConnFromReq(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
export const addBaraaIncome = async (req: any, res: Response, next: any) => {
  try {
    const { baraaId, too, tailbar, ognoo, khairtsag, zadgai } = req.body;

    if (!baraaId || !too) {
      return res.status(400).json({ success: false, message: "Бараа болон тоо шаардлагатай" });
    }

    const updated = await baraaIncomeNemekh(
      baraaId,
      Number(too),
      tailbar,
      ognoo,
      getFsmConnFromReq(req),
      {
        khairtsag,
        zadgai,
        ajiltniiId: req.ajiltan?._id?.toString() || "",
        ajiltniiNer: req.ajiltan?.ner || req.ajiltan?.nevtrekhNer || "",
      },
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// Барааны орлогын түүх
export const getBaraaOrlogiinTuukh = async (req: any, res: Response, next: any) => {
  try {
    const baiguullagiinId =
      req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    const barilgiinId = req.query.barilgiinId;

    if (!baiguullagiinId || !barilgiinId) {
      return res
        .status(400)
        .json({ success: false, message: "Байгууллага, барилга шаардлагатай" });
    }

    const tuukh = await baraaOrlogiinTuukh(
      baiguullagiinId,
      barilgiinId,
      {
        baraaId: req.query.baraaId,
        ekhlekh: req.query.ekhlekh,
        duusakh: req.query.duusakh,
        khyazgaar: req.query.khyazgaar,
      },
      getFsmConnFromReq(req),
    );

    res.json({ success: true, data: tuukh });
  } catch (err) {
    next(err);
  }
};

// POST /baraas/import — Excel-ээс уншсан мөрүүдийг шалгах (dryRun) / оруулах.
// Хариу: { success, data: { dun: {shine, orlogo, shineAngilal, aldaa}, murnuud: [{mur, tuluv, aldaa, ...}] } }
export const importBaraa = async (req: any, res: Response, next: any) => {
  try {
    const baiguullagiinId = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const { rows, fileNer, barilgiinId } = req.body || {};
    // Тодорхой `false` ирээгүй бол шалгалт л хийнэ.
    const dryRun = req.body?.dryRun !== false;

    if (!baiguullagiinId || !barilgiinId) {
      return res
        .status(400)
        .json({ success: false, message: "Байгууллага, барилга шаардлагатай" });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "Оруулах мөр алга" });
    }
    if (rows.length > IMPORT_KHYAZGAAR) {
      return res.status(400).json({
        success: false,
        message: `Нэг удаад ${IMPORT_KHYAZGAAR}-аас ихгүй мөр оруулна`,
      });
    }

    const ur = await baraaExceleesOruulakh(
      {
        rows,
        fileNer: fileNer || "",
        dryRun,
        baiguullagiinId: String(baiguullagiinId),
        barilgiinId: String(barilgiinId),
        ajiltniiId: (req.ajiltan?._id || req.ajiltan?.id || "").toString(),
        ajiltniiNer: req.ajiltan?.ner || req.ajiltan?.nevtrekhNer || "",
      },
      getFsmConnFromReq(req),
    );

    // Алдаатай мөртэй үед юу ч хадгалагдаагүй — бүгд эсвэл юу ч үгүй.
    if (!dryRun && !ur.khadgalsan) {
      return res.status(400).json({
        success: false,
        message: "Алдаатай мөр байгаа тул оруулсангүй",
        data: ur,
      });
    }

    if (ur.khadgalsan) {
      // Socket-ийн үйл явдлыг мөр бүрээр биш, нэг л удаа.
      const { emitToRoom }: any = require("../utils/socket");
      emitToRoom("broadcast", "baraa_updated", { import: true, importId: ur.importId });
    }

    res.json({ success: true, data: ur });
  } catch (err) {
    next(err);
  }
};
