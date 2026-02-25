import dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

const PORT = process.env.PORT || "8000";

export const config = {
  PORT,
};

