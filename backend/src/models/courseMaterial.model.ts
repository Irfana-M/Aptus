import { Schema, model, Document, Types } from 'mongoose';

export interface ICourseMaterial extends Document {
  mentorId: Types.ObjectId;
  subjectId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  
  type: 'study_material' | 'assignment';
  title: string;
  description: string;
  
  attachments: {
    fileName: string;
    fileKey: string;
    fileSize: number;
    uploadedAt: Date;
  }[];
  
  assignmentDetails?: {
    dueDate: Date;
    assignedTo: Types.ObjectId[];
    allowLateSubmission: boolean;
    maxScore?: number;
  };
  
  category?: 'notes' | 'reference' | 'recording' | 'assignment';
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const CourseMaterialSchema = new Schema<ICourseMaterial>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
    
    type: { 
      type: String, 
      enum: ['study_material', 'assignment'], 
      required: true,
      index: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    
    attachments: [{
      fileName: { type: String, required: true },
      fileKey: { type: String, required: true },
      fileSize: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    assignmentDetails: {
      dueDate: { type: Date },
      assignedTo: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
      allowLateSubmission: { type: Boolean, default: false },
      maxScore: { type: Number }
    },
    
    category: { 
      type: String, 
      enum: ['notes', 'reference', 'recording', 'assignment'] 
    },
    status: { 
      type: String, 
      enum: ['active', 'archived'], 
      default: 'active',
      index: true 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
CourseMaterialSchema.index({ mentorId: 1, type: 1, status: 1 });
CourseMaterialSchema.index({ 'assignmentDetails.assignedTo': 1, type: 1, status: 1 });
CourseMaterialSchema.index({ 'assignmentDetails.dueDate': 1, status: 1 });

export const CourseMaterial = model<ICourseMaterial>('CourseMaterial', CourseMaterialSchema);
