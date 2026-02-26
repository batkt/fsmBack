import { Response } from "express";
import {
  uilchluulegchJagsaalt,
  uilchluulegchUusgekh,
  uilchluulegchZasakh,
  uilchluulegchUstgakh,
  uilchluulegchNegAvakh,
} from "../services/uilchluulegchService";

export const getUilchluulegchs = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {};
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    if (bid) query.baiguullagiinId = bid;

    if (req.query.tuluv) query.tuluv = req.query.tuluv;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;

    const list = await uilchluulegchJagsaalt(query);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const getUilchluulegch = async (req: any, res: Response, next: any) => {
  try {
    const item = await uilchluulegchNegAvakh(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Үйлчлүүлэгч олдсонгүй" });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const createUilchluulegch = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const data = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid })
    };
    const item = await uilchluulegchUusgekh(data);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const updateUilchluulegch = async (req: any, res: Response, next: any) => {
  try {
    const item = await uilchluulegchZasakh(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, message: "Үйлчлүүлэгч олдсонгүй" });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const deleteUilchluulegch = async (req: any, res: Response, next: any) => {
  try {
    const item = await uilchluulegchUstgakh(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Үйлчлүүлэгч олдсонгүй" });
    res.json({ success: true, message: "Үйлчлүүлэгч амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
