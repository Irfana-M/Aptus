import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.config.js';
import router from './routes/auth.routes.js';
import adminRouter from "./routes/admin.routes.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URI, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true 
}));

app.use(express.json());

app.use('/api/auth', router);
app.use('/api/admin', adminRouter);

connectDB();

app.get('/', (req, res) => {
  res.send('API is working');
});

export default app;