
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { StudentModel } from '../models/student/student.model';

dotenv.config();

const STUDENT_ID = '695630c6f523adbe04f9367b'; // ID from logs

const checkProfile = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        const student = await StudentModel.findById(STUDENT_ID);
        if (!student) {
            console.error('Student not found');
            return;
        }

        console.log('--- Student Debug Info ---');
        console.log(`ID: ${student._id}`);
        console.log(`Email: ${student.email}`);
        console.log(`Verified: ${student.isVerified}`);
        console.log(`OnboardingStatus: ${student.onboardingStatus}`);
        console.log(`isProfileCompleted (Flag): ${student.isProfileCompleted}`);
        
        const s = student.toObject() as any;
        
        console.log('--- Field Check ---');
        console.log(`fullName: ${s.fullName}`);
        console.log(`phoneNumber: ${s.phoneNumber}`);
        console.log(`gender: ${s.gender}`);
        console.log(`dateOfBirth: ${s.dateOfBirth}`);
        console.log(`age: ${s.age}`);
        console.log(`contactInfo.address: ${s.contactInfo?.address}`);
        console.log(`contactInfo.country: ${s.contactInfo?.country}`);
        console.log(`parentInfo.name: ${s.contactInfo?.parentInfo?.name}`);
        console.log(`parentInfo.phoneNumber: ${s.contactInfo?.parentInfo?.phoneNumber}`);
        console.log(`parentInfo.relationship: ${s.contactInfo?.parentInfo?.relationship}`);
        console.log(`gradeId: ${s.gradeId}`);
        console.log(`academicDetails.grade: ${s.academicDetails?.grade}`);
        console.log(`academicDetails.institutionName: ${s.academicDetails?.institutionName}`);
        console.log(`academicDetails.syllabus: ${s.academicDetails?.syllabus}`);

        // Re-run the completion check logic
        const isComplete = Boolean(
            s.fullName && 
            s.email && 
            s.phoneNumber &&
            s.gender &&
            s.dateOfBirth &&
            s.age &&
            s.contactInfo?.address &&
            s.contactInfo?.country &&
            s.contactInfo?.parentInfo?.name &&
            s.contactInfo?.parentInfo?.phoneNumber &&
            s.contactInfo?.parentInfo?.relationship &&
            (s.gradeId || s.academicDetails?.grade) &&
            s.academicDetails?.institutionName &&
            s.academicDetails?.syllabus
        );

        console.log(`\nCalculated Completion: ${isComplete}`);
        
        if (!isComplete) {
            console.log('MISSING FIELDS:');
            if (!s.fullName) console.log('- fullName');
            if (!s.email) console.log('- email');
            if (!s.phoneNumber) console.log('- phoneNumber');
            if (!s.gender) console.log('- gender');
            if (!s.dateOfBirth) console.log('- dateOfBirth');
            if (!s.age) console.log('- age');
            if (!s.contactInfo?.address) console.log('- address');
            if (!s.contactInfo?.country) console.log('- country');
            if (!s.contactInfo?.parentInfo?.name) console.log('- parentInfo.name');
            if (!s.contactInfo?.parentInfo?.phoneNumber) console.log('- parentInfo.phoneNumber');
            if (!s.contactInfo?.parentInfo?.relationship) console.log('- parentInfo.relationship');
            if (!s.gradeId && !s.academicDetails?.grade) console.log('- grade');
            if (!s.academicDetails?.institutionName) console.log('- institutionName');
            if (!s.academicDetails?.syllabus) console.log('- syllabus');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkProfile();
