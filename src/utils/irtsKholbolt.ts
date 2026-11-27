import mongoose from "mongoose";
import { config } from "../config";
import { getErunkhiiCol } from "./db";

// irtsWeb-ээс ирсэн хүсэлтийн ажилтан irts-ийн ерөнхий баазад (irtsWeb-ийн
// "Ажилтан бүртгэл") байдаг тул turees-ийн ajiltan-аас олдохгүй. Энэ холболтыг
// IRTS_MONGODB_URI тохируулсан үед л нээнэ.
let irtsKholbolt: mongoose.Connection | null = null;

function irtsKholboltAvakh(): mongoose.Connection | null {
  if (!config.IRTS_MONGODB_URI) return null;
  if (!irtsKholbolt) {
    irtsKholbolt = mongoose.createConnection(config.IRTS_MONGODB_URI);
    irtsKholbolt.on("error", (err) => console.error("[irtsKholbolt] алдаа:", err.message));
  }
  return irtsKholbolt;
}

export const irtsKhereglegchEsekh = (req: any) => req?.ajiltan?.systemiinTurul === "irts";

/** Хүсэлтийн ажилтны системийн (turees эсвэл irts) ajiltan collection. */
export function ajiltanColAvakh(req: any) {
  if (irtsKhereglegchEsekh(req)) {
    const kholbolt = irtsKholboltAvakh();
    if (!kholbolt) {
      console.warn("[irtsKholbolt] IRTS_MONGODB_URI тохируулаагүй — irts ажилтан хайх боломжгүй");
      return null;
    }
    return kholbolt.collection("ajiltan");
  }
  return getErunkhiiCol("ajiltan");
}
