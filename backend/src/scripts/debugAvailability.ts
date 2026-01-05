
import mongoose, { Schema, Document, Types } from "mongoose";

// --- Minimal Schema Definitions to approximate the app ---
// We don't need full schemas, just enough to run the query.

const MentorSchema = new Schema({
    fullName: String,
    email: String,
    isActive: Boolean,
    isVerified: Boolean,
    approvalStatus: String,
    isBlocked: Boolean,
    subjectProficiency: [{ 
        subject: String, 
        level: String 
    }],
    profilePicture: String,
    availability: [{
        day: String,
        slots: [{
            startTime: String,
            endTime: String,
            isBooked: Boolean
        }]
    }]
}, { collection: 'mentors' }); // Ensure collection name matches

const SubjectSchema = new Schema({
    subjectName: String,
    grade: Schema.Types.ObjectId
}, { collection: 'subjects' });

const CourseSchema = new Schema({
    mentor: Schema.Types.ObjectId,
    status: String,
    isActive: Boolean,
    schedule: {
        days: [String],
        timeSlot: String
    }
}, { collection: 'courses' });

const MentorModel = mongoose.model('Mentor', MentorSchema);
const SubjectModel = mongoose.model('Subject', SubjectSchema);
const CourseModel = mongoose.model('Course', CourseSchema);

// --- DB Connection ---
// Hardcoding a potential local URI or using env. 
// Standard local Mongo URI is mongodb://localhost:27017/aptus_db (guessing DB name from context or 'aptus')
// The user has 'aptus' likely.
const MONGO_URI = "mongodb://localhost:27017/aptus"; // Guessing. If fails, I'll ask user.

async function run() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");
        
        // --- Inputs from User Logs ---
        const subjectId = "69415462c8b1cdecafd8c3d5";
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        // const timeSlot = "17:00-18:00:1"; // The malformed one
        const timeSlot = "17:00-18:00"; // The correct one (try both)

        console.log(`Searching for Subject ID: ${subjectId}`);
        const subject = await SubjectModel.findById(subjectId);
        if (!subject) {
            console.log("Subject NOT FOUND");
            return;
        }
        console.log(`Subject Found: ${subject.subjectName}`);
        const subjectName = subject.subjectName;

        // --- Aggregation Pipeline ---
        // Copy-pasting the pipeline logic from MentorRepository
        
        const matchStage = {
            isActive: { $ne: false },
            isVerified: true,
            approvalStatus: "approved",
            isBlocked: false,
            subjectProficiency: {
                $elemMatch: {
                    subject: { $regex: new RegExp(`^${subjectName}$`, "i") },
                    level: { $in: ["intermediate", "expert"] }
                }
            }
        };

        console.log("Match Stage:", JSON.stringify(matchStage, null, 2));

        const pipeline: any[] = [
            { $match: matchStage },
            {
                $project: {
                    fullName: 1,
                    availability: 1,
                },
            }
        ];

        
        pipeline.push({
            $lookup: {
                from: "courses",
                let: { mentorId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$mentor", "$$mentorId"] },
                                    { $in: ["$status", ["booked", "ongoing"]] },
                                    { $eq: ["$isActive", true] },
                                    { $eq: ["$schedule.timeSlot", timeSlot] },
                                    { $gt: [ { $size: { $setIntersection: ["$schedule.days", days] } }, 0 ] }
                                ]
                            }
                        }
                    }
                ],
                as: "conflictingBookings"
            }
        });
        
        console.log("Running aggregation...");
        const mentors = await MentorModel.aggregate(pipeline);
        console.log(`Found ${mentors.length} mentors.`);
        console.log(JSON.stringify(mentors, null, 2));

    } catch (error) {
        console.error("CRASHED:", error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
