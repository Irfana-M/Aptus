import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findSpecificStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB connection failed');

    const studentId = '696788152e03c64c8a9cee98';
    console.log(`Searching for student with ID: ${studentId}`);
    
    const student = await db.collection('students').findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    if (student) {
        console.log(`Found Student: ${student.fullName} (Email: ${student.email})`);
    } else {
        console.log('Student not found by ID. Searching all students to see if any have this ID as a string...');
        const allStudents = await db.collection('students').find({}).toArray();
        const found = allStudents.find(s => s._id.toString() === studentId);
        if (found) {
            console.log(`Found Student (string match): ${found.fullName}`);
        } else {
            console.log('Student truly not found.');
        }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findSpecificStudent();
