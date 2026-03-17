import api from './api';
import type { ApiResponse } from '../types/api.types';
import { API_ROUTES } from '../constants/apiRoutes';

// Types
export interface StudyMaterial {
  _id: string;
  mentorId: { _id: string; fullName: string };
  subjectId?: { _id: string; subjectName: string };
  materialType: 'study_material' | 'assignment';
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  originalName: string;
  fileSize: number;
  assignmentDetails?: {
    dueDate: string;
    assignedTo: string[];
    allowLateSubmission: boolean;
  };
  status: 'active' | 'archived';
  createdAt: string;
}

export interface AssignmentSubmission {
  _id: string;
  materialId: string;
  studentId: { _id: string; fullName: string; email: string };
  files: {
    fileName: string;
    fileKey: string;
    fileSize: number;
    uploadedAt: string;
  }[];
  submittedAt: string;
  isLate: boolean;
  status: 'pending' | 'reviewed';
  reviewedAt?: string;
  feedback?: string;
}

// === MENTOR APIs ===

export const getMentorMaterials = async (type?: 'study_material' | 'assignment'): Promise<ApiResponse<StudyMaterial[]>> => {
  const url = type 
    ? `${API_ROUTES.CLASSROOM.MENTOR_MATERIALS}?type=${type}`
    : API_ROUTES.CLASSROOM.MENTOR_MATERIALS;
  const response = await api.get<ApiResponse<StudyMaterial[]>>(url);
  return response.data;
};

export const createAssignment = async (formData: FormData): Promise<ApiResponse<StudyMaterial>> => {
  const response = await api.post<ApiResponse<StudyMaterial>>(API_ROUTES.CLASSROOM.CREATE_ASSIGNMENT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAssignmentSubmissions = async (assignmentId: string): Promise<ApiResponse<AssignmentSubmission[]>> => {
  const url = API_ROUTES.CLASSROOM.ASSIGNMENT_SUBMISSIONS.replace(':assignmentId', assignmentId);
  const response = await api.get<ApiResponse<AssignmentSubmission[]>>(url);
  return response.data;
};

export const provideFeedback = async (submissionId: string, feedback: string): Promise<ApiResponse<AssignmentSubmission>> => {
  const url = API_ROUTES.CLASSROOM.PROVIDE_FEEDBACK.replace(':submissionId', submissionId);
  const response = await api.put<ApiResponse<AssignmentSubmission>>(url, { feedback });
  return response.data;
};

export const getMentorDownloadUrl = async (fileKey: string): Promise<ApiResponse<{ url: string }>> => {
  const url = API_ROUTES.CLASSROOM.MENTOR_DOWNLOAD.replace(':fileKey', encodeURIComponent(fileKey));
  const response = await api.get<ApiResponse<{ url: string }>>(url);
  return response.data;
};

// === STUDENT APIs ===

export const getStudentMaterials = async (): Promise<ApiResponse<StudyMaterial[]>> => {
  const response = await api.get<ApiResponse<StudyMaterial[]>>(API_ROUTES.CLASSROOM.STUDENT_MATERIALS);
  return response.data;
};

export const getStudentAssignments = async (): Promise<ApiResponse<StudyMaterial[]>> => {
  const response = await api.get<ApiResponse<StudyMaterial[]>>(API_ROUTES.CLASSROOM.STUDENT_ASSIGNMENTS);
  console.log(response.data);
  return response.data;
};

export const submitAssignment = async (assignmentId: string, formData: FormData): Promise<ApiResponse<AssignmentSubmission>> => {
  const url = API_ROUTES.CLASSROOM.SUBMIT_ASSIGNMENT.replace(':assignmentId', assignmentId);
  const response = await api.post<ApiResponse<AssignmentSubmission>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getMySubmission = async (assignmentId: string): Promise<ApiResponse<AssignmentSubmission>> => {
  const url = API_ROUTES.CLASSROOM.MY_SUBMISSION.replace(':assignmentId', assignmentId);
  const response = await api.get<ApiResponse<AssignmentSubmission>>(url);
  return response.data;
};

export const getStudentDownloadUrl = async (fileKey: string): Promise<ApiResponse<{ url: string }>> => {
  const url = API_ROUTES.CLASSROOM.STUDENT_DOWNLOAD.replace(':fileKey', encodeURIComponent(fileKey));
  const response = await api.get<ApiResponse<{ url: string }>>(url);
  return response.data;
};

export const uploadStudyMaterial = async (sessionId: string, formData: FormData): Promise<ApiResponse<StudyMaterial>> => {
  const url = API_ROUTES.CLASSROOM.UPLOAD_MATERIAL.replace(':sessionId', sessionId);
  const response = await api.post<ApiResponse<StudyMaterial>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
