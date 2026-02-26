import express, { Application, Request, Response } from "express";
import http from "http";
import path from "path";
import { config } from "./config";

const { db }: any = require("zevbackv2");

const app: Application = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// Routes
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import taskTuukhRoutes from "./routes/taskTuukhRoutes";
import chatRoutes from "./routes/chatRoutes";
import baraaRoutes from "./routes/baraaRoutes";
import uilchluulegchRoutes from "./routes/uilchluulegchRoutes";
import subTaskRoutes from "./routes/subTaskRoutes";
import baiguullagaRoute from "./routes/dbRoute";

app.use(authRoutes);
app.use(projectRoutes);
app.use(taskRoutes);
app.use(taskTuukhRoutes);
app.use(chatRoutes);
app.use(baraaRoutes);
app.use(uilchluulegchRoutes);
app.use(subTaskRoutes);
app.use(baiguullagaRoute);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


import { initSocket } from "./utils/socket";

const server = http.createServer(app);
initSocket(server);

async function start() {
  try {
    await db.kholboltUusgey(
      app,
      process.env.BAAZ,
    );

    // Ensure central connection has kholboltFSM for models that require it
    if (db.erunkhiiKholbolt && !db.erunkhiiKholbolt.kholboltFSM) {
      db.erunkhiiKholbolt.kholboltFSM = db.erunkhiiKholbolt.kholbolt;
    }

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

