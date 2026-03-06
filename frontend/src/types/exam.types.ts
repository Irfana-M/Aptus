export type QuestionType = 'MCQ' | 'SUBJECTIVE';

export const QuestionType = {
  MCQ: 'MCQ' as QuestionType,
  SUBJECTIVE: 'SUBJECTIVE' as QuestionType,
} as const;

export interface IQuestion {
  _id?: string; // Optional for creation, present in fetched data
  text: string;
  type: QuestionType;
  options?: { _id?: string; text: string; isCorrect: boolean }[];
  marks: number;
  hint?: string;
  isPremium?: boolean;
}

export interface IExam {
  _id: string;
  title: string;
  description: string;
  subjectId: string | { _id: string; subjectName: string };
  gradeId: string | { _id: string; name: string };
  mentorId: string | { _id: string; fullName: string };
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  isPremium?: boolean;
  questions: IQuestion[];
  scheduledAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IEnrichedExam extends IExam {
  attemptStatus: 'COMPLETED' | 'PENDING_REVIEW' | null;
  resultId: string | null;
}

export interface IAnswer {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  textAnswer?: string;
  marksObtained: number;
  feedback?: string;
}

export interface IExamResult {
  _id: string;
  studentId: string;
  examId: string | IExam; // Populated or ID
  score: number;
  totalMarks: number;
  status: 'COMPLETED' | 'PENDING_REVIEW';
  answers: IAnswer[];
  startedAt: string;
  submittedAt: string;
}

// DTOs
export interface CreateQuestionDTO {
  text: string;
  type: QuestionType;
  options?: { text: string; isCorrect: boolean }[];
  marks: number;
  isPremium?: boolean;   
  hint?: string;
}

export interface CreateExamDTO {
  title: string;
  description: string;
  subjectId: string;
  gradeId: string;
  duration: number;
  passingMarks: number;
  questions: CreateQuestionDTO[];
  scheduledAt?: string;
  isPremium?: boolean;
}

export interface SubmitAnswerDTO {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  textAnswer?: string;
}

export interface SubmitExamDTO {
  examId: string;
  answers: SubmitAnswerDTO[];
}
