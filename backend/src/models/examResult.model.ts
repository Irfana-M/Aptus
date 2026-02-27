import mongoose, { Schema, Document } from 'mongoose';

export enum ExamStatus {
  COMPLETED = 'COMPLETED',
  PENDING_REVIEW = 'PENDING_REVIEW', 
}
export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOptionId?: string; 
  selectedOptionText?: string;
  textAnswer?: string; 
  marksObtained: number;
  feedback?: string;
}

export interface IExamResult extends Document {
  studentId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  score: number;
  totalMarks: number;
  status: ExamStatus;
  answers: IAnswer[];
  startedAt: Date;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  selectedOptionId: { type: String }, // For MCQ
  selectedOptionText: { type: String }, 
  textAnswer: { type: String },
  marksObtained: { type: Number, default: 0 },
  feedback: { type: String }, // Mentor feedback
});

const ExamResultSchema = new Schema<IExamResult>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, required: true },
    status: { type: String, enum: Object.values(ExamStatus), default: ExamStatus.COMPLETED },
    answers: { type: [AnswerSchema], default: [] },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate attempts for the same exam if needed (optional)
// ExamResultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

export const ExamResult = mongoose.model<IExamResult>('ExamResult', ExamResultSchema);
