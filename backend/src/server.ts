import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { container } from "./inversify.config";
(global as unknown as { container: typeof container }).container = container;
import { SocketService } from "./services/SocketService";
import { CronService } from "./services/CronService";
import { NotificationManager } from "./services/NotificationManager";
import { MentorLeaveEventListener } from "./listeners/MentorLeaveEventListener";
import { TYPES } from "./types";

const PORT = process.env.PORT || 5000;

const httpServer = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

SocketService.attach(httpServer);
const socketService = container.get<SocketService>(TYPES.ISocketService);
socketService.initialize();

console.log("✅ HTTP Server running on port:", PORT);
console.log("✅ SocketService attached to HTTP server");
console.log("✅ SocketService initialized");
console.log("📡 WebSocket server should be ready at:", `ws://localhost:${PORT}`);

// Initialize Notification Manager
const notificationManager = container.get<NotificationManager>(TYPES.INotificationManager);
notificationManager.initialize();
console.log("🔔 Notification Manager initialized");

// Initialize Mentor Leave Event Listener
const mentorLeaveListener = container.get<MentorLeaveEventListener>(TYPES.MentorLeaveEventListener);
mentorLeaveListener.initialize();
console.log("📅 Mentor Leave Event Listener initialized");

// Start Cron Jobs
const cronService = container.get<CronService>(TYPES.CronService);
cronService.start();
console.log("⏰ Cron Jobs started");