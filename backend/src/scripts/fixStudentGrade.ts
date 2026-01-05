
import mongoose from "mongoose";
import { StudentModel } from "../models/student/student.model";
import { Grade } from "../models/grade.model";
import dotenv from "dotenv";
import path from "path";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function fixStudentGrade() {
  try {
    // Connect to APTUS database
    const uri = "mongodb://127.0.0.1:27017/aptus"; 
    await mongoose.connect(uri);
    console.log("Connected to Aptus DB.");

    const studentEmail = "irfana.18m@gmail.com"; 
    
    const student = await StudentModel.findOne({ email: studentEmail });
    if (!student) {
      console.error(`Student with email ${studentEmail} not found!`);
      return;
    }

    console.log("Current Student Grade:", student.gradeId);

    if (!student.gradeId) {
       console.log("Student is missing gradeId. Fetching a default grade...");
       // Fetch a grade (e.g., Grade 10 or first available)
       const grade = await Grade.findOne();
       if (!grade) {
         console.error("No grades found in DB!");
         return;
       }
       
       console.log(`Assigning Grade: ${grade.name} (${grade._id})`);
       student.gradeId = grade._id as any;
       
       // Fix invalid onboardingStatus if present
       if (student.onboardingStatus === 'preferences_submitted') {
           console.log("Fixing invalid onboardingStatus 'preferences_submitted' -> 'preferences_completed'");
           student.onboardingStatus = 'preferences_completed';
       }
       
       await student.save();
       console.log("Student updated successfully!");
    } else {
       console.log("Student already has a gradeId.");
    }

  } catch (error) {
    console.error("Error fixing student grade:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

fixStudentGrade();
