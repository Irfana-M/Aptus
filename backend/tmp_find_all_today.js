import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findTodaySessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    const db = mongoose.connection.db;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    console.log(`Checking ALL sessions between ${todayStart.toISOString()} and ${todayEnd.toISOString()}`);

    const allSessions = await db.collection('class_sessions').find({
      startTime: { $gte: todayStart, $lte: todayEnd }
    }).toArray();

    console.log(`Found ${allSessions.length} total sessions in class_sessions`);
    allSessions.forEach(s => {
        console.log(`ID: ${s._id}, Start: ${s.startTime.toISOString()}, Status: ${s.status}, Subject: ${s.subjectId}`);
    });

    const anyTrial = await db.collection('trialclasses').find({
        status: { $ne: 'cancelled' }
    }).sort({ preferredDate: -1 }).limit(5).toArray();
    console.log('Recent Trials:', anyTrial.map(t => ({ id: t._id, date: t.preferredDate, time: t.preferredTime, status: t.status })));

    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

findTodaySessions();
