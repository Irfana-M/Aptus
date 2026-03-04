
import { TrialClass } from "./models/student/trialClass.model.js";
import mongoose from "mongoose";

async function findMentorTrials() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aptus");
    
    const mentorId = "69872e68395b5bc181cda0d8";
    const trials = await TrialClass.find({ mentor: new mongoose.Types.ObjectId(mentorId) });
    
    console.log(`Found ${trials.length} trials for mentor ${mentorId}`);
    trials.forEach(trial => {
        console.log(`- Trial ID: ${trial._id}, Status: ${trial.status}, Student: ${trial.student}`);
    });
    
    await mongoose.disconnect();
}

findMentorTrials().catch(console.error);
