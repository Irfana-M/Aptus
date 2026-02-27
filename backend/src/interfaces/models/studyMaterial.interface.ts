import { Document, Types } from "mongoose";

export interface IStudyMaterial extends Document {
  sessionId?: Types.ObjectId;      
  courseId?: Types.ObjectId;       
  mentorId: Types.ObjectId;
  studentId?: Types.ObjectId;      
  subjectId?: Types.ObjectId;      
  slotId?: Types.ObjectId;         
  

  materialType: 'study_material' | 'assignment';
  
  
  title: string;
  description?: string;
  fileUrl: string;                 
  fileType: string;                
  originalName: string;
  fileSize: number;
  
  
  assignmentDetails?: {
    dueDate: Date;
    assignedTo: Types.ObjectId[];  
    allowLateSubmission: boolean;
  };
  
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}


export interface IAssignmentSubmission extends Document {
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
