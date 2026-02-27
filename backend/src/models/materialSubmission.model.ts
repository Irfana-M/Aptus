import { Schema, model, Document, Types } from 'mongoose';

export interface IMaterialSubmission extends Document {
  materialId: Types.ObjectId;
  studentId: Types.ObjectId;
  
  files: {
    fileName: string;
    fileKey: string;
    fileSize: number;
    uploadedAt: Date;
  }[];
  
  submittedAt: Date;
  isLate: boolean;
  
  status: 'pending' | 'reviewed';
  reviewedAt?: Date;
  feedback?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSubmissionSchema = new Schema<IMaterialSubmission>(
  {
    materialId: { 
      type: Schema.Types.ObjectId, 
      ref: 'CourseMaterial', 
      required: true,
      index: true 
    },
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Student', 
      required: true,
      index: true 
    },
    
    files: [{
      fileName: { type: String, required: true },
      fileKey: { type: String, required: true },
      fileSize: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    
    status: { 
      type: String, 
      enum: ['pending', 'reviewed'], 
      default: 'pending',
      index: true 
    },
    reviewedAt: { type: Date },
    feedback: { type: String }
  },
  { timestamps: true }
);

// Compound index for efficient queries
MaterialSubmissionSchema.index({ materialId: 1, studentId: 1 }, { unique: true });
MaterialSubmissionSchema.index({ studentId: 1, status: 1 });

export const MaterialSubmission = model<IMaterialSubmission>('MaterialSubmission', MaterialSubmissionSchema);
