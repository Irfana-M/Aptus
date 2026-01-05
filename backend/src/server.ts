// import "reflect-metadata"; 
// import dotenv from "dotenv";
// dotenv.config();

// import app from "./app";

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// server.ts — FINAL VERSION
import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { container } from "./inversify.config";
(global as any).container = container;
import { SocketService } from "./services/SocketService";
import { CronService } from "./services/CronService";
import { NotificationManager } from "./services/NotificationManager";
import { TYPES } from "./types";

const PORT = 5000;

const httpServer = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

SocketService.attach(httpServer);  // ← This line
const socketService = container.get<SocketService>(TYPES.ISocketService);
socketService.initialize();       // ← This line

console.log("✅ HTTP Server running on port:", PORT);
console.log("✅ SocketService attached to HTTP server");
console.log("✅ SocketService initialized");
console.log("📡 WebSocket server should be ready at:", `ws://localhost:${PORT}`);

// Initialize Notification Manager
const notificationManager = container.get<NotificationManager>(TYPES.INotificationManager);
notificationManager.initialize();
console.log("🔔 Notification Manager initialized");

// Start Cron Jobs
const cronService = container.get<CronService>(TYPES.CronService);
cronService.start();
console.log("⏰ Cron Jobs started");