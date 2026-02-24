import express, { Application, Request, Response } from "express";
import http from "http";

const PORT = process.env.PORT || 3000;

const app: Application = express();

// Middleware
app.use(express.json());

// Basic health check route
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from TypeScript Express server 👋");
});

// Create HTTP server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;

