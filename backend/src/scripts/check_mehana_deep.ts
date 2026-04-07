import mongoose from 'mongoose';
import dotenv from 'dotenv';
import '../models/student/student.model';
import '../models/scheduling/session.model';

dotenv.config();

async function checkMehanaSessionDeep() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB connection failed');

    // 1. Search for students with name containing Mehana
    console.log('Searching for students with name containing Mehana');
    const students = await db.collection('students').find({
        fullName: { $regex: /Mehana/i }
    }).toArray();

    if (students.length === 0) {
        console.log('No students named Mehana found');
        process.exit(0);
    }

    students.forEach(s => console.log(`Found: ${s.fullName} (${s._id})`));

    // 2. Find sessions for these students
    for (const student of students) {
        console.log(`\n --- Sessions for ${student.fullName} (${student._id}) ---`);
        const sessions = await db.collection('class_sessions').find({
            $or: [
                { studentId: student._id },
                { 'participants.userId': student._id }
            ]
        }).sort({ startTime: -1 }).limit(10).toArray();

        if (sessions.length === 0) {
            console.log('No sessions found at all.');
        } else {
            sessions.forEach(s => {
                console.log(`ID: ${s._id}`);
                console.log(`Start: ${s.startTime.toISOString()}`);
                if (s.endTime) console.log(`End:   ${s.endTime.toISOString()}`);
                else console.log('End:   MISSING');
                console.log(`Status: ${s.status}`);
                console.log('---');
            });
        }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkMehanaSessionDeep();
