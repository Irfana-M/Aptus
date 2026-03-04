import type { CreateQuestionDTO } from "./CreateExamDTO.js";

export interface UpdateExamDTO {
  title?: string;
  description?: string;
  duration?: number;
  passingMarks?: number;
  questions?: CreateQuestionDTO[];
  scheduledAt?: Date;
  isActive?: boolean;
}
