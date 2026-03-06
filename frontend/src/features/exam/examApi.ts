import api from "../../api/api";
import type { ApiResponse } from "../../api/api";
import type { CreateExamDTO, SubmitExamDTO, IExam, IExamResult } from "../../types/exam.types";

export const examApi = {
  createExam: (data: CreateExamDTO) => api.post<ApiResponse<IExam>>("/exams", data),
  
  getExamsByMentor: () => api.get<ApiResponse<IExam[]>>("/exams/mentor/my-exams"),
  
  getExamsForStudent: () => api.get<ApiResponse<IExam[]>>("/exams/student"),
  
  getExamById: (examId: string) => api.get<ApiResponse<IExam>>(`/exams/${examId}`),
  
  submitExam: (data: SubmitExamDTO) => api.post<ApiResponse<IExamResult>>("/exams/submit", data),
  
  getStudentResults: () => api.get<ApiResponse<IExamResult[]>>("/exams/student/results"),

  // Mentor Grading
  getExamResults: (examId: string) => api.get<ApiResponse<IExamResult[]>>(`/exams/${examId}/results`),
  gradeExam: (resultId: string, grades: { questionId: string; marks: number; feedback?: string }[]) => 
    api.patch<ApiResponse<IExamResult>>(`/exams/results/${resultId}/grade`, { grades }),
};

