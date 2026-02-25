import express, { Application, Request, Response } from "express";
import http from "http";
import { config } from "./config";

const { db }: any = require("zevbackv2");

const app: Application = express();

app.use(express.json());

// Routes
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
// app.use(authRoutes);
app.use(projectRoutes);


const server = http.createServer(app);

async function start() {
  try {
    await db.kholboltUusgey(
      app,
      "mongodb://admin:Br1stelback1@103.143.40.175:27017/turees?authSource=admin",
    );

    server.listen(config.PORT, () => {
      console.log(
        `Server is running on http://localhost:${config.PORT} and connected via zevbackv2`,
      );
    });
  } catch (err) {
    console.error("[startup] Failed to start service:", err);
    process.exit(1);
  }
}

start();

export default app;

