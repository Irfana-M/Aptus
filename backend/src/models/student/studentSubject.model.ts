import mongoose, { Schema } from 'mongoose';
import type { IStudentSubject } from '../../interfaces/models/studentSubject.interface.js';

const studentSubjectSchema = new Schema<IStudentSubject>(
  {
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Student', 
      required: true 
    },
    subjectId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Subject', 
      required: true 
    },
    subscriptionId: { 
      type: Schema.Types.ObjectId, 
      ref: 'StudentSubscription', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['selected', 'enrolled', 'completed'], 
      default: 'selected',
      required: true 
    },
  },
  { timestamps: true }
);

// Ensure a student can't select the same subject twice for the same subscription period
studentSubjectSchema.index({ studentId: 1, subjectId: 1, subscriptionId: 1 }, { unique: true });

export const StudentSubjectModel = mongoose.model<IStudentSubject>(
  'StudentSubject',
  studentSubjectSchema
);
