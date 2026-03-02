import dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

const PORT = process.env.PORT || "8000";
// APP_SECRET must match tureesBack's APP_SECRET for token compatibility
// Default matches tureesBack's default: "tokenUusgekhZevTabs2022"
const APP_SECRET = process.env.APP_SECRET || "tokenUusgekhZevTabs2022";

export const config = {
  PORT,
  APP_SECRET,
};

