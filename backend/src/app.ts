import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.config";
import router from "./routes/auth.routes";
import adminRouter from "./routes/admin.routes";
import passport from "./config/passport.config";
import mentorRouter from "./routes/mentor.routes";
import path from "path";
import s3Routes from "./routes/s3Routes";
import studentRouter from "./routes/student.routes";
import roleRoutes from "./routes/role.routes";
import videoRouter from "./routes/videoCall.routes";
import courseRequestRouter from "./routes/courseRequest.routes";
import courseRouter from "./routes/course.routes";
import enrollmentRouter from "./routes/enrollment.routes";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  console.log(`[CORS] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  console.log(`[CORS] Allowed origin: ${process.env.CLIENT_URL}`);
  next();
});

app.use(express.json());
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

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", s3Routes);

connectDB();

app.get("/", (req, res) => {
  res.send("API is working");
});

export default app;
