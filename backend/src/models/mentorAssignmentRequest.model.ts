import mongoose, { Schema, Document } from "mongoose";

export interface IMentorAssignmentRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  mentoringMode?: 'one-to-one' | 'group';
}

const mentorAssignmentRequestSchema = new Schema<IMentorAssignmentRequest>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
      index: true
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true
    },
    mentoringMode: {
      type: String,
      enum: ['one-to-one', 'group'],
      default: 'one-to-one'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    },
    rejectionReason: {
      type: String
    }
  },
  { timestamps: true }
);

// Index for querying pending requests
mentorAssignmentRequestSchema.index({ status: 1, requestedAt: -1 });

// Index for student's requests
mentorAssignmentRequestSchema.index({ studentId: 1, subjectId: 1 });

export const MentorAssignmentRequest = (mongoose.models.MentorAssignmentRequest as mongoose.Model<IMentorAssignmentRequest>) || mongoose.model<IMentorAssignmentRequest>(
  'MentorAssignmentRequest',
  mentorAssignmentRequestSchema
);
