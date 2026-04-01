import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkCoursesAndSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB connection failed');

    console.log('--- COURSES ---');
    const courses = await db.collection('courses').find({}).toArray();
    console.log(`Found ${courses.length} courses`);
    for (const c of courses) {
        console.log(`Course: ${c.courseName} (${c._id}) - Status: ${c.status}`);
    }

    console.log('\n--- ENROLLMENTS ---');
    const enrollments = await db.collection('enrollments').find({}).toArray();
    console.log(`Found ${enrollments.length} enrollments`);
    
    console.log('\n--- ALL SESSIONS IN DB ---');
    const allSessions = await db.collection('class_sessions').find({}).sort({startTime: -1}).limit(10).toArray();
    console.log(`Last 10 sessions in class_sessions:`);
    for (const s of allSessions) {
        console.log(`[${s.startTime.toISOString()}] - [${s.endTime?.toISOString()}] - Status: ${s.status} - ID: ${s._id}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCoursesAndSessions();
