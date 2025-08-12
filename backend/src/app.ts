import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.config.js';
import router from './routes/auth.routes.js';

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URI, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true 
}));

app.use(express.json());

app.use('/api/student', router);

connectDB();

app.get('/', (req, res) => {
  res.send('API is working');
});

export default app;