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

const seedGrades = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
  
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aptus');
    console.log('✅ Connected to MongoDB');

   
    console.log('🧹 Clearing existing grades...');
    await Grade.deleteMany({});
    console.log('✅ Cleared existing grades');

    
    const grades = [
     
      { name: "Grade 8", syllabus: "CBSE", grade: 8, isActive: true },
      { name: "Grade 9", syllabus: "CBSE", grade: 9, isActive: true },
      { name: "Grade 10", syllabus: "CBSE", grade: 10, isActive: true },
      { name: "Grade 11", syllabus: "CBSE", grade: 11, isActive: true },
      { name: "Grade 12", syllabus: "CBSE", grade: 12, isActive: true },
      
      
      { name: "Grade 8", syllabus: "STATE", grade: 8, isActive: true },
      { name: "Grade 9", syllabus: "STATE", grade: 9, isActive: true },
      { name: "Grade 10", syllabus: "STATE", grade: 10, isActive: true },
      { name: "Grade 11", syllabus: "STATE", grade: 11, isActive: true },
      { name: "Grade 12", syllabus: "STATE", grade: 12, isActive: true },
      
      { name: "Grade 8", syllabus: "ICSE", grade: 8, isActive: true },
      { name: "Grade 9", syllabus: "ICSE", grade: 9, isActive: true },
      { name: "Grade 10", syllabus: "ICSE", grade: 10, isActive: true },
      { name: "Grade 11", syllabus: "ICSE", grade: 11, isActive: true },
      { name: "Grade 12", syllabus: "ICSE", grade: 12, isActive: true },
    ];

    console.log('🌱 Seeding grades...');
    await Grade.insertMany(grades);
    console.log(`✅ Successfully seeded ${grades.length} grades`);

 
    const allGrades = await Grade.find();
    console.log('\n📊 Grades in database:');
    allGrades.forEach(grade => {
      console.log(`   - ${grade.name} (${grade.syllabus})`);
    });

    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding grades:', error);
    process.exit(1);
  }
};


seedGrades();