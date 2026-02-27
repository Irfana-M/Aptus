import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  grade: mongoose.Types.ObjectId;       
  subject: mongoose.Types.ObjectId;      
  mentor: mongoose.Types.ObjectId;       
  student?: mongoose.Types.ObjectId;     
  students?: mongoose.Types.ObjectId[];  
  batchName?: string;                    
  schedule: {
    days: string[];
    timeSlot: string;
    slots?: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };                     
  startDate: Date;
  endDate: Date;
  totalSessions?: number;
  fee?: number;
  courseType: "one-to-one" | "group";
  maxStudents: number;
  enrolledStudents: number;
  status: "available" | "booked" | "ongoing" | "completed" | "cancelled";
  isActive: boolean;
}

const CourseSchema = new Schema<ICourse>(
  {
    grade: { type: Schema.Types.ObjectId, ref: "Grade", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    mentor: { type: Schema.Types.ObjectId, ref: "Mentor", required: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    batchName: { type: String },
    schedule: {
      days: [{ 
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      }],
      timeSlot: { type: String }, // "17:00-18:00"
      slots: [{
        day: String,
        startTime: String,
        endTime: String
      }]
    }, 
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalSessions: { type: Number },
    fee: { type: Number, required: false, default: 0 },
    courseType: { 
      type: String, 
      enum: ["one-to-one", "group"], 
      default: "one-to-one" 
    },
    maxStudents: { type: Number, default: 1 },
    enrolledStudents: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["available", "booked", "ongoing", "completed", "cancelled"],
      default: "available",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Pre-save hook to validate course type constraints
CourseSchema.pre('save', function(next) {
  if (this.courseType === 'one-to-one') {
    // For 1:1 courses, ensure maxStudents is 1
    this.maxStudents = 1;
    // Clear students array if accidentally set
    if (this.students && this.students.length > 0) {
      this.students = [];
    }
  } else if (this.courseType === 'group') {
    // For group courses, calculate enrolledStudents from students array
    if (this.students && this.students.length > 0) {
      this.enrolledStudents = this.students.length;
    }
    // Ensure batchName exists for group courses
    if (!this.batchName) {
      this.batchName = `${this.subject} Batch`;
    }
  }
  next();
});


CourseSchema.index({ status: 1 });
CourseSchema.index({ mentor: 1 });

export const Course = mongoose.model<ICourse>("Course", CourseSchema);