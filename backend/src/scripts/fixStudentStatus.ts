
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { StudentModel } from '../models/student/student.model';

dotenv.config();

const STUDENT_ID = '695630c6f523adbe04f9367b';

const fixStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        const result = await StudentModel.updateOne(
            { _id: STUDENT_ID },
            { 
                $set: { 
                    isProfileCompleted: true,
                    onboardingStatus: 'profile_complete'
                }
            }
        );

        console.log('Update Result:', result);
        console.log('Student status manually fixed to profile_complete.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

fixStudent();
