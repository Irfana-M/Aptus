import mongoose from 'mongoose';
import dotenv from 'dotenv';
import '../models/student/student.model.js';
import '../models/scheduling/session.model.js';

dotenv.config();

async function checkMehanaSession() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB connection failed');

    // 1. Find the student "Mehana"
    const student = await db.collection('students').findOne({ 
        fullName: { $regex: /Mehana/i } 
    });

    if (!student) {
        console.log('Student Mehana not found');
        process.exit(0);
    }

    console.log(`Found Student: ${student.fullName} (ID: ${student._id})`);

    // 2. Find sessions for this student today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sessions = await db.collection('class_sessions').find({
        $or: [
            { studentId: student._id },
            { 'participants.userId': student._id }
        ],
        startTime: { $gte: todayStart, $lte: todayEnd }
    }).toArray();

    console.log(`Found ${sessions.length} sessions for Mehana today`);
    sessions.forEach(s => {
        console.log(`ID: ${s._id}`);
        console.log(`Start: ${s.startTime.toISOString()}`);
        console.log(`End:   ${s.endTime ? s.endTime.toISOString() : 'MISSING'}`);
        console.log(`Status: ${s.status}`);
        console.log('---');
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkMehanaSession();
