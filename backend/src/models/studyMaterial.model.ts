import mongoose, { Schema } from "mongoose";
import type { IStudyMaterial, IAssignmentSubmission } from "../interfaces/models/studyMaterial.interface.js";

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: "TimeSlot",
    },
    materialType: {
      type: String,
      enum: ["study_material", "assignment"],
      default: "study_material",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ["pdf", "video", "image", "other"],
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    assignmentDetails: {
      dueDate: { type: Date },
      assignedTo: [{ type: Schema.Types.ObjectId, ref: "Student" }],
      allowLateSubmission: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true, collection: "study_materials" }
);

// Indexes
studyMaterialSchema.index({ sessionId: 1 });
studyMaterialSchema.index({ studentId: 1 });
studyMaterialSchema.index({ courseId: 1 });
studyMaterialSchema.index({ mentorId: 1, materialType: 1 });
studyMaterialSchema.index({ "assignmentDetails.assignedTo": 1 });
studyMaterialSchema.index({ "assignmentDetails.dueDate": 1 });

export const StudyMaterialModel = mongoose.model<IStudyMaterial>("StudyMaterial", studyMaterialSchema);

// Assignment Submission Schema
const assignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "StudyMaterial",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    files: [{
      fileName: { type: String, required: true },
      fileKey: { type: String, required: true },
      fileSize: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now },
    }],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
    },
    reviewedAt: { type: Date },
    feedback: { type: String },
  },
  { timestamps: true, collection: "assignment_submissions" }
);

// Unique submission per student per assignment
assignmentSubmissionSchema.index({ materialId: 1, studentId: 1 }, { unique: true });
assignmentSubmissionSchema.index({ studentId: 1, status: 1 });

export const AssignmentSubmissionModel = mongoose.model<IAssignmentSubmission>("AssignmentSubmission", assignmentSubmissionSchema);

