import mongoose, { Schema } from "mongoose";
import type { ISession, ISessionParticipant } from "../../interfaces/models/session.interface";
import { SESSION_STATUS } from "../../constants/status.constants";

const participantSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "participants.role",
    },

    role: {
      type: String,
      enum: ["student", "mentor"],
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "present", "absent"],
      default: "scheduled",
    },
  },
  { _id: false }
);

const sessionSchema = new Schema<ISession>(
  {
    timeSlotId: {
      type: Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: "Student" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment" },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    sessionType: {
      type: String,
      enum: ["group", "one-to-one"],
      required: true,
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator: function (arr: ISessionParticipant[]) {
          return (
            arr.some((p: ISessionParticipant) => p.role === "mentor") &&
            arr.some((p: ISessionParticipant) => p.role === "student")
          );
        },
        message: "Session must include at least one mentor and one student",
      },
    },
    mentorStatus: {
      type: String,
      enum: ["scheduled", "present", "absent"],
      default: "scheduled",
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.SCHEDULED,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    actualStartTime: Date,
    actualEndTime: Date,
    webRTCId: String,
    recordingUrl: String,
    mentorNotes: String,
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ["student", "mentor", "admin"],
    },
    leaveRequestedAt: Date,
    isRescheduled: { type: Boolean, default: false },
    rescheduledTo: { type: Schema.Types.ObjectId, ref: "Session" },
  },
  { timestamps: true, collection: "class_sessions" }
);

// Indexes
sessionSchema.index({ timeSlotId: 1, startTime: 1 }, { unique: true }); // Prevent duplicate occurrences
sessionSchema.index({ mentorId: 1, startTime: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ "participants.userId": 1 });
sessionSchema.index({ "participants.role": 1 });
sessionSchema.index({ "participants.status": 1 });

export const SessionModel = mongoose.model<ISession>("Session", sessionSchema);
