export interface SubmitAnswerDTO {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  textAnswer?: string;
}

export interface SubmitExamDTO {
  studentId: string;
  examId: string;
  answers: SubmitAnswerDTO[];
}
