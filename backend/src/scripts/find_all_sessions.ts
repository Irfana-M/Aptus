import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findAllSessionsToday() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB connection failed');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    console.log(`Searching for ALL sessions in 'class_sessions' between ${todayStart.toISOString()} and ${todayEnd.toISOString()}`);

    const sessions = await db.collection('class_sessions').find({
        startTime: { $gte: todayStart, $lte: todayEnd }
    }).toArray();

    console.log(`Found ${sessions.length} sessions in total for today.`);
    for (const s of sessions) {
        const student = await db.collection('students').findOne({ _id: s.studentId });
        const mentor = await db.collection('mentors').findOne({ _id: s.mentorId });
        console.log(`ID: ${s._id}`);
        console.log(`Student: ${student ? student.fullName : 'UNKNOWN'} (${s.studentId})`);
        console.log(`Mentor: ${mentor ? mentor.fullName : 'UNKNOWN'} (${s.mentorId})`);
        console.log(`Start: ${s.startTime.toISOString()}`);
        console.log(`End:   ${s.endTime ? s.endTime.toISOString() : 'MISSING'}`);
        console.log(`Status: ${s.status}`);
        console.log('---');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findAllSessionsToday();
