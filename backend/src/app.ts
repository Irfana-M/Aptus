import "reflect-metadata";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.config.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import router from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";
import passport from "./config/passport.config.js";
import mentorRouter from "./routes/mentor.routes.js";
import path from "path";
import s3Routes from "./routes/s3Routes.js";
import studentRouter from "./routes/student.routes.js";
import roleRoutes from "./routes/role.routes.js";
import videoRouter from "./routes/videoCall.routes.js";
import courseRequestRouter from "./routes/courseRequest.routes.js";
import courseRouter from "./routes/course.routes.js";
import enrollmentRouter from "./routes/enrollment.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import availabilityRouter from "./routes/availability.routes.js";
import trialClassRouter from "./routes/trialClassRoutes.js";
import chatRouter from "./routes/chat.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import sessionRouter from "./routes/session.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import { attendanceRouter } from "./routes/attendance.routes.js";
import examRouter from "./routes/exam.routes.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-expected-role", "X-User-Role"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  console.log(`[CORS] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  console.log(`[CORS] Allowed origin: ${process.env.CLIENT_URL}`);
  next();
});

app.use(express.json());
app.use(cookieParser()); 
app.use(passport.initialize());


app.use("/api/auth", router);
app.use("/api/admin", adminRouter);
app.use("/api/mentor", mentorRouter);
app.use("/api/student", studentRouter);
app.use('/api/role', roleRoutes);
app.use('/api/video-call', videoRouter);
app.use('/api/course-requests', courseRequestRouter);
app.use('/api/courses', courseRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/trial-classes', trialClassRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/exams', examRouter);

app.use(errorHandler);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", s3Routes);

connectDB();

app.get("/", (req, res) => {
  res.send("API is working");
});

export default app;
