import { Response } from "express";
import {
  medegdelJagsaalt,
  medegdelUusgekh,
  medegdelZasakh,
  medegdelKharlaa,
  medegdelNegAvakh,
  medegdelUstgakh,
  medegdelBuhKharlaa,
  medegdelUnreadCount,
} from "../services/medegdelService";
import { emitToRoom } from "../utils/socket";

export const getMedegdels = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {};
    const ajiltniiId = req.ajiltan?.id || req.query.ajiltniiId;
    
    if (ajiltniiId) query.ajiltniiId = ajiltniiId;
    if (req.query.baiguullagiinId) query.baiguullagiinId = req.query.baiguullagiinId;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;
    if (req.query.projectId) query.projectId = req.query.projectId;
    if (req.query.taskId) query.taskId = req.query.taskId;
    if (req.query.turul) query.turul = req.query.turul;
    if (req.query.kharsanEsekh !== undefined) {
      query.kharsanEsekh = req.query.kharsanEsekh === "true";
    }

    const medegdels = await medegdelJagsaalt(query);
    res.json({ success: true, data: medegdels });
  } catch (err) {
    next(err);
  }
};

export const createMedegdel = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const data = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid }),
      ajiltniiId: req.body.ajiltniiId || req.ajiltan?.id,
    };

    const medegdel = await medegdelUusgekh(data);

    // Emit real-time notification via Socket.IO
    if (medegdel.ajiltniiId) {
      emitToRoom(`user_${medegdel.ajiltniiId}`, "new_notification", medegdel);
    }
    if (medegdel.projectId) {
      emitToRoom(`project_${medegdel.projectId}`, "new_notification", medegdel);
    }
    if (medegdel.taskId) {
      emitToRoom(`task_${medegdel.taskId}`, "new_notification", medegdel);
    }

    res.status(201).json({ success: true, data: medegdel });
  } catch (err) {
    next(err);
  }
};

export const updateMedegdel = async (req: any, res: Response, next: any) => {
  try {
    const medegdel = await medegdelZasakh(req.params.id, req.body);
    if (!medegdel) {
      return res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй" });
    }
    res.json({ success: true, data: medegdel });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: any, res: Response, next: any) => {
  try {
    const ajiltniiId = req.ajiltan?.id || req.body.ajiltniiId;
    if (!ajiltniiId) {
      return res.status(400).json({ success: false, message: "Ажилтны ID шаардлагатай" });
    }

    const medegdel = await medegdelKharlaa(req.params.id, ajiltniiId);
    if (!medegdel) {
      return res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй" });
    }

    res.json({ success: true, data: medegdel });
  } catch (err) {
    next(err);
  }
};

export const getMedegdel = async (req: any, res: Response, next: any) => {
  try {
    const medegdel = await medegdelNegAvakh(req.params.id);
    if (!medegdel) {
      return res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй" });
    }
    res.json({ success: true, data: medegdel });
  } catch (err) {
    next(err);
  }
};

export const deleteMedegdel = async (req: any, res: Response, next: any) => {
  try {
    await medegdelUstgakh(req.params.id);
    res.json({ success: true, message: "Мэдэгдэл устгагдлаа" });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: any, res: Response, next: any) => {
  try {
    const ajiltniiId = req.ajiltan?.id || req.body.ajiltniiId;
    if (!ajiltniiId) {
      return res.status(400).json({ success: false, message: "Ажилтны ID шаардлагатай" });
    }

    const baiguullagiinId = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    const result = await medegdelBuhKharlaa(ajiltniiId, baiguullagiinId);
    
    res.json({
      success: true,
      message: `${result.modifiedCount} мэдэгдэл уншсан болголоо`,
      count: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req: any, res: Response, next: any) => {
  try {
    const ajiltniiId = req.ajiltan?.id || req.query.ajiltniiId;
    if (!ajiltniiId) {
      return res.status(400).json({ success: false, message: "Ажилтны ID шаардлагатай" });
    }

    const baiguullagiinId = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    const count = await medegdelUnreadCount(ajiltniiId, baiguullagiinId);
    
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
};
