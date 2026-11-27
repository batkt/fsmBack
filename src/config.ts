import dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

const PORT = process.env.PORT || "8000";
// APP_SECRET must match tureesBack's APP_SECRET for token compatibility
// Default matches tureesBack's default: "tokenUusgekhZevTabs2022"
const APP_SECRET = process.env.APP_SECRET || "tokenUusgekhZevTabs2022";

// irtsWeb (irts.zevtabs.mn)-ээр нэвтэрсэн ажилтны токен. irtsBack-ийн
// tokhirgoo.env-ийн APP_SECRET-тэй ижил байх ёстой.
const IRTS_APP_SECRET = process.env.IRTS_APP_SECRET || "tokenUusgekhZevTabsIrts2026";
// irts-ийн ерөнхий бааз (ajiltan, baiguullaga). irts хэрэглэгчийн ажилтны
// мэдээллийг эндээс уншина. Тохируулаагүй бол irts ажилтны нэр/эрх олдохгүй.
const IRTS_MONGODB_URI = process.env.IRTS_MONGODB_URI || "";

export const config = {
  PORT,
  APP_SECRET,
  IRTS_APP_SECRET,
  IRTS_MONGODB_URI,
};
