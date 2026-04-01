import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function checkBothCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    console.log('Connected to DB');
    const db = mongoose.connection.db;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    console.log(`Checking for sessions between ${todayStart.toISOString()} and ${todayEnd.toISOString()}`);

    const classSessions = await db.collection('class_sessions').find({
      startTime: { $gte: todayStart, $lte: todayEnd }
    }).toArray();
    console.log(`class_sessions count: ${classSessions.length}`);

    const sessions = await db.collection('sessions').find({
      startTime: { $gte: todayStart, $lte: todayEnd }
    }).toArray();
    console.log(`sessions collection count: ${sessions.length}`);

    if (sessions.length > 0) {
        console.log('Sample from "sessions":', sessions[0]);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkBothCollections();
