import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { StudentModel } from '../src/models/student/student.model.js';
import { GradeModel } from '../src/models/grade.model.js';

dotenv.config();

/**
 * Migration script to add gradeId references to existing students
 * Maps academicDetails.grade string to Grade document reference
 */

async function migrateStudentGrades() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all students
    const students = await StudentModel.find({});
    console.log(`📊 Found ${students.length} students to process`);

    let updated = 0;
    let skipped = 0;

    for (const student of students) {
      // Skip if already has gradeId
      if (student.gradeId) {
        skipped++;
        continue;
      }

      // Get grade from academicDetails
      const gradeName = student.academicDetails?.grade;
      
      if (!gradeName) {
        console.log(`⚠️  Student ${student.fullName} (${student._id}) has no grade in academicDetails`);
        skipped++;
        continue;
      }

      // Find matching Grade document
      const grade = await GradeModel.findOne({ name: gradeName });
      
      if (!grade) {
        console.log(`⚠️  No Grade found for "${gradeName}" (Student: ${student.fullName})`);
        skipped++;
        continue;
      }

      // Update student with gradeId
      await StudentModel.updateOne(
        { _id: student._id },
        { $set: { gradeId: grade._id } }
      );

      console.log(`✅ Updated ${student.fullName}: ${gradeName} -> ${grade._id}`);
      updated++;
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Updated: ${updated} students`);
    console.log(`   ⏭️  Skipped: ${skipped} students`);
    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run migration
migrateStudentGrades()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
