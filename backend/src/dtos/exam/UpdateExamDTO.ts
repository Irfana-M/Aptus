import type { CreateQuestionDTO } from "./CreateExamDTO";

export interface UpdateExamDTO {
  title?: string;
  description?: string;
  duration?: number;
  passingMarks?: number;
  questions?: CreateQuestionDTO[];
  scheduledAt?: Date;
  isActive?: boolean;
}
