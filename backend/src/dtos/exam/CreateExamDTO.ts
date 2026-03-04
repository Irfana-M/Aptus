import { QuestionType } from "../../models/exam.model.js";

export interface CreateQuestionDTO {
  text: string;
  type: QuestionType;
  options?: { text: string; isCorrect: boolean; hint?: string }[];
  marks: number;
  isPremium?: boolean;
  hint?: string;
}

export interface CreateExamDTO {
  title: string;
  description: string;
  subjectId: string;
  gradeId: string;
  mentorId: string;
  duration: number;
  passingMarks: number;
  questions: CreateQuestionDTO[];
  scheduledAt?: Date;
  isPremium?: boolean;
  syllabus?: string;
}
