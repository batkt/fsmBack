import express, { Application, Request, Response } from "express";
import http from "http";
import path from "path";
import { config } from "./config";

const { db }: any = require("zevbackv2");

import cors from "cors";

const app: Application = express();

// Configure CORS and Security Headers
app.use(cors({
  origin: [
    "https://turees.zevtabs.mn", 
    "https://103.143.40.175", 
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  credentials: true
}));

// Set Referrer-Policy to allow cross-origin requests from specific origins
app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
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
import medegdelRoutes from "./routes/medegdelRoutes";
import fcmTokenRoutes from "./routes/fcmTokenRoutes";
import taskStatusRoutes from "./routes/taskStatusRoutes";
import kpiRoutes from "./routes/kpiRoutes";


app.use(authRoutes);
app.use(projectRoutes);
app.use(taskRoutes);
app.use(taskTuukhRoutes);
app.use(chatRoutes);
app.use(baraaRoutes);
app.use(uilchluulegchRoutes);
app.use(subTaskRoutes);
app.use(baiguullagaRoute);
app.use(medegdelRoutes);
app.use(fcmTokenRoutes);
app.use(taskStatusRoutes);
app.use(kpiRoutes);


app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


import { initSocket } from "./utils/socket";
import { loadAllFsmConnections } from "./utils/fsmConnection";
import { initializeFirebase } from "./services/fcmService";

const server = http.createServer(app);
const socketIO = initSocket(server);
if (socketIO) {
  console.log("[Server] ✅ Socket.IO initialized and ready");
} else {
  console.error("[Server] ❌ Socket.IO initialization failed");
}

async function start() {
  try {
    // Connect to main database (turees)
    await db.kholboltUusgey(
      app,
      process.env.BAAZ,
    );

    // Wait a moment for zevbackv2 to potentially set up FSM connections
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check what zevbackv2 has set up
    console.log("[Startup] Checking zevbackv2 connection structure...");
    if (db.erunkhiiKholbolt) {
      console.log("[Startup] db.erunkhiiKholbolt keys:", Object.keys(db.erunkhiiKholbolt));
      if (db.erunkhiiKholbolt.kholboltFSM) {
        console.log("[Startup] kholboltFSM already exists from zevbackv2!");
      } else {
        console.log("[Startup] kholboltFSM not found, will attempt to create it");
      }
    }

    await loadAllFsmConnections();

    // Initialize Firebase Admin SDK for push notifications
    console.log("[Startup] Initializing Firebase...");
    initializeFirebase();
    console.log("[Startup] Firebase initialization completed");

    // Start task status scheduler (checks every minute)
    const { startTaskStatusScheduler } = require("./utils/taskStatusScheduler");
    const schedulerInterval = process.env.TASK_STATUS_CHECK_INTERVAL 
      ? parseInt(process.env.TASK_STATUS_CHECK_INTERVAL) 
      : 1; // Default updated to 1 minute for better responsiveness
    startTaskStatusScheduler(schedulerInterval);
    console.log(`[Startup] ✅ Task status scheduler started (checking every ${schedulerInterval} minutes)`);

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

