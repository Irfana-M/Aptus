

import { TrialClass } from "./models/student/trialClass.model.js";
import mongoose from "mongoose";

async function checkTrialClass() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aptus");
    
    const trialId = "69876e87a60813e9066f8d5c";
    const trial = await TrialClass.findById(trialId).populate('mentor').populate('student');
    
    if (!trial) {
        console.log("❌ Trial class not found");
    } else {
        console.log("✅ Trial Class Details:", {
            id: trial._id.toString(),
            status: trial.status,
            student: (trial.student as { _id?: { toString(): string } | string })?._id?.toString() || trial.student,
            mentor: (trial.mentor as { _id?: { toString(): string } | string })?._id?.toString() || trial.mentor,
            mentorName: (trial.mentor as { fullName?: string })?.fullName
        });
    }
    
    await mongoose.disconnect();
}

checkTrialClass().catch(console.error);
