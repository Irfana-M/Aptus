import 'reflect-metadata';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SessionRepository } from '../repositories/session.repository';
import '../models/subject.model';
import '../models/student/student.model';
import '../models/mentor/mentor.model';
import '../models/scheduling/session.model';
import '../models/grade.model';

dotenv.config();

async function testRepository() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aptus');
    console.log('Connected to DB');
    
    // Manually create a session that started 30 mins ago but is still scheduled
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB connection failed');

    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 30 * 60 * 1000);

    const testStudentId = '696788152e03c64c8a9cee98'; // Using an existing student ID from earlier check
    
    // Insert a temporary test session
    const tempSession = {
        studentId: new mongoose.Types.ObjectId(testStudentId),
        mentorId: new mongoose.Types.ObjectId('6967460b44285c8750d10e4f'),
        subjectId: new mongoose.Types.ObjectId('69415462c8b1cdecafd8c3cf'),
        timeSlotId: new mongoose.Types.ObjectId('6969efb9b15d524bc3565ddf'),
        startTime: thirtyMinsAgo,
        endTime: oneHourLater,
        status: 'scheduled',
        sessionType: 'one-to-one',
        participants: [
            { userId: new mongoose.Types.ObjectId(testStudentId), role: 'student', status: 'scheduled' }
        ]
    };
    
    const result = await db.collection('class_sessions').insertOne(tempSession);
    console.log(`Inserted test session: ${result.insertedId}`);

    const repo = new SessionRepository();
    const sessions = await repo.findUpcomingByStudent(testStudentId);
    
    console.log(`Found ${sessions.length} upcoming sessions for student`);
    const found = sessions.find(s => (s as any)._id.toString() === result.insertedId.toString());
    
    if (found) {
        console.log('SUCCESS: The recently started session was found!');
        console.log(`Session Start Time: ${(found as any).startTime.toISOString()}`);
    } else {
        console.log('FAILURE: The recently started session was NOT found.');
    }

    // Cleanup
    await db.collection('class_sessions').deleteOne({ _id: result.insertedId });
    console.log('Cleaned up test session');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testRepository();
