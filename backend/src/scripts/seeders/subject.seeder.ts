
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const gradeSchema = new mongoose.Schema({
  name: String,
  syllabus: String,
  grade: Number,
  isActive: Boolean
});
const Grade = mongoose.model('Grade', gradeSchema);

const subjectSchema = new mongoose.Schema({
  subjectName: String,
  syllabus: String,
  grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade' },
  isActive: Boolean
});
const Subject = mongoose.model('Subject', subjectSchema);

const seedSubjects = async () => {
  try {
    console.log('🔗 Connecting...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aptus');
    console.log('✅ Connected');

    console.log('🧹 Clearing subjects...');
    await Subject.deleteMany({});

    const grades = await Grade.find({ isActive: true });
    if (grades.length === 0) {
      console.log('❌ No grades found. Run grade seeder first.');
      process.exit(1);
    }

    const subjectsToInsert: Record<string, unknown>[] = [];
    const standardSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science"];

    for (const g of grades) {
      for (const subjName of standardSubjects) {
        subjectsToInsert.push({
          subjectName: subjName,
          syllabus: g.syllabus,
          grade: g._id,
          isActive: true
        });
      }
    }

    console.log(`🌱 Seeding ${subjectsToInsert.length} subjects...`);
    await Subject.insertMany(subjectsToInsert);
    console.log('✅ Subjects seeded successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedSubjects();
