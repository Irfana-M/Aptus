import mongoose, { Schema, Document } from 'mongoose';

export enum QuestionType {
  MCQ = 'MCQ',
  SUBJECTIVE = 'SUBJECTIVE',
}

export interface IQuestion {
  text: string;
  type: QuestionType;
  options?: { text: string; isCorrect: boolean }[]; 
  marks: number;
  isPremium: boolean;
  hint?: string;
}

export interface IExam extends Document {
  title: string;
  description: string;
  subjectId: mongoose.Types.ObjectId;
  gradeId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId; // Who created the exam
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  questions: IQuestion[];
  scheduledAt?: Date;
  syllabus: string; // e.g. "CBSE", "ICSE", "State Board"
  isActive: boolean;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  type: { type: String, enum: Object.values(QuestionType), required: true },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, required: true },
    },
  ],
  marks: { type: Number, required: true, min: 1 },
  isPremium: { type: Boolean, default: false },
  hint: { type: String },
});

const ExamSchema = new Schema<IExam>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    gradeId: { type: Schema.Types.ObjectId, ref: 'Grade', required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
    duration: { type: Number, required: true, min: 1 }, // Duration in minutes
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    questions: { type: [QuestionSchema], required: true },
    scheduledAt: { type: Date },
    syllabus: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Basic validation to ensure total marks match sum of question marks
ExamSchema.pre('save', function (next) {
  if (this.questions) {
    const calculatedTotal = this.questions.reduce((sum, q) => sum + q.marks, 0);
    this.totalMarks = calculatedTotal;
  }
  next();
});

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);
