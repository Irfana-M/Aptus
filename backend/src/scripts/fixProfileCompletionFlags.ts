/**
 * Script to fix isProfileCompleted flag for students with complete profiles
 * Run this once to update existing student records
 */

import mongoose from 'mongoose';
import { StudentModel } from '../models/student/student.model';

async function fixProfileCompletionFlags() {
  try {
    console.log('🔧 Starting profile completion flag fix...');

    // Find all students with complete profile data but flag is false
    const students = await StudentModel.find({
      isProfileCompleted: false,
      // Check for essential fields
      fullName: { $exists: true, $ne: '' },
      email: { $exists: true, $ne: '' },
      phoneNumber: { $exists: true, $ne: '' },
      gender: { $exists: true, $ne: '' },
      age: { $exists: true },
      'contactInfo.address': { $exists: true, $ne: '' },
      'contactInfo.country': { $exists: true, $ne: '' },
      'contactInfo.parentInfo.name': { $exists: true, $ne: '' },
      'contactInfo.parentInfo.phoneNumber': { $exists: true, $ne: '' },
      'academicDetails.institutionName': { $exists: true, $ne: '' },
      'academicDetails.grade': { $exists: true, $ne: '' },
      'academicDetails.syllabus': { $exists: true, $ne: '' }
    });

    console.log(`📊 Found ${students.length} students with complete profiles but flag = false`);

    if (students.length === 0) {
      console.log('✅ No students need updating!');
      return;
    }

    // Update each student
    let updated = 0;
    for (const student of students) {
      await StudentModel.updateOne(
        { _id: student._id },
        { $set: { isProfileCompleted: true } }
      );
      console.log(`✅ Updated: ${student.fullName} (${student.email})`);
      updated++;
    }

    console.log(`\n🎉 Successfully updated ${updated} student records!`);
  } catch (error) {
    console.error('❌ Error fixing profile completion flags:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aptus';
  
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('📦 Connected to MongoDB');
      return fixProfileCompletionFlags();
    })
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { fixProfileCompletionFlags };
