import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const sessionSchema = new mongoose.Schema({}, { strict: false });
const Session = mongoose.model('Session', sessionSchema, 'class_sessions');

async function checkSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    console.log('Connected to DB');
    
    const now = new Date();
    console.log(`Server Current Time (UTC): ${now.toISOString()}`);
    console.log(`Searching from (today 00:00 UTC): ${new Date(new Date().setHours(0,0,0,0)).toISOString()}`);
    
    const sessions = await Session.find({
      startTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      status: { $in: ['scheduled', 'in_progress', 'rescheduling', 'cancelled'] }
    }).limit(10).lean();

    console.log(`Found ${sessions.length} sessions for today onward`);
    sessions.forEach(s => {
      console.log(`ID: ${s._id}`);
      console.log(`Subject: ${s.subjectId}`);
      console.log(`Start: ${s.startTime.toISOString()}`);
      console.log(`End:   ${s.endTime ? s.endTime.toISOString() : 'MISSING'}`);
      console.log('---');
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSessions();
