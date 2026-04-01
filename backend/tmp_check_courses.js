import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    console.log('Connected to DB');
    const db = mongoose.connection.db;

    const courses = await db.collection('courses').find({
      status: 'booked'
    }).toArray();
    console.log(`Active (booked) courses: ${courses.length}`);
    
    courses.forEach(c => {
      console.log(`Course: ${c._id}`);
      console.log(`Subject: ${c.subject}`);
      console.log(`Schedule:`, c.schedule);
      console.log(`Days:`, c.schedule?.days);
      console.log(`TimeSlot:`, c.schedule?.timeSlot);
      console.log('---');
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCourses();
