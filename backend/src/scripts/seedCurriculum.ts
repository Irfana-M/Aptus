
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Grade } from "../models/grade.model.js";
import { Subject } from "../models/subject.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aptus";

const curriculumData = {
  CBSE: {
    grades: [8, 9, 10],
    subjects: [
      // Core Bundles (School Exams)
      "Mathematics",
      "Science",
      "Social Science",
      // Granular (Tuition Focus)
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Geography",
      "Political Science (Civics)",
      "Economics", // Mostly 9-10
      // Languages & Others
      "English",
      "Hindi",
      "Computer Science",
      "Artificial Intelligence" // New CBSE trend
    ]
  },
  ICSE: {
    grades: [8, 9, 10],
    subjects: [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "History & Civics", // Usually combined in ICSE
      "Geography",
      "English Literature",
      "English Language",
      "Computer Applications",
      "Economics",
      "Commercial Studies",
      "Environmental Science",
      "Hindi"
    ]
  },
  STATE: {
    grades: [8, 9, 10],
    subjects: [
      // Similar to CBSE but kept flexible
      "Mathematics",
      "Science",
      "Social Science",
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Geography",
      "Civics",
      "English",
      "Regional Language", 
      "Hindi"
    ]
  }
};

const seedCurriculum = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    console.log("Clearing existing Grades and Subjects...");
    await Grade.deleteMany({});
    await Subject.deleteMany({});

    for (const [syllabus, data] of Object.entries(curriculumData)) {
      console.log(`Seeding ${syllabus}...`);
      
      for (const gradeNum of data.grades) {
        // Create Grade
        const gradeDoc = await Grade.create({
          name: `Grade ${gradeNum}`,
          grade: gradeNum,
          syllabus: syllabus as "CBSE" | "ICSE" | "STATE",
          isActive: true
        });

        // Create Subjects for this Grade
        const subjectDocs = data.subjects.map(subName => ({
          subjectName: subName,
          syllabus: syllabus as "CBSE" | "ICSE" | "STATE",
          grade: gradeDoc._id,
          isActive: true
        }));

        await Subject.insertMany(subjectDocs);
        console.log(`  Added Grade ${gradeNum} with ${subjectDocs.length} subjects.`);
      }
    }

    console.log("✅ Curriculum seeding completed successfully.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedCurriculum();
