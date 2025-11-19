import authApi from '../../../api/authApi';
import type { 
  TrialClassRequest, 
  TrialClassResponse, 
  FeedbackRequest, 
  Grade,
  Subject
} from '../../../types/trialTypes';

export const studentTrialApi = {
  requestTrialClass: async (data: TrialClassRequest): Promise<TrialClassResponse> => {
    const response = await authApi.post('/student/trial-classes/request', data);
    return response.data.data;
  },

  getGradesByEducationType: async (educationType: string): Promise<Grade[]> => {
    const response = await authApi.get(`/student/grades/syllabus?syllabus=${educationType}`);
    return response.data.data;
  },

  getStudentTrialClasses: async (): Promise<TrialClassResponse[]> => {
    const response = await authApi.get('/student/trial-classes');
    return response.data.data;
  },

  getTrialClassById: async (id: string): Promise<TrialClassResponse> => {
    const response = await authApi.get(`/student/trial-classes/${id}`);
    return response.data.data;
  },

  submitFeedback: async (trialClassId: string, feedback: FeedbackRequest): Promise<TrialClassResponse> => {
    const response = await authApi.post(`/student/trial-classes/${trialClassId}/feedback`, feedback);
    return response.data.data;
  },

  cancelTrialClass: async (trialClassId: string): Promise<TrialClassResponse> => {
    const response = await authApi.patch(`/student/trial-classes/${trialClassId}/cancel`);
    return response.data.data;
  },

  getGrades: async (): Promise<Grade[]> => {
    const response = await authApi.get('student/grades');
    return response.data.data;
  },

  getSubjectsByGrade: async (gradeId: string): Promise<Subject[]> => {
    const response = await authApi.get(`student/subjects?grade=${gradeId}`);
    return response.data.data;
  },


  getSubjectsByGradeAndSyllabus: async (grade: number, syllabus: string): Promise<Subject[]> => {
    const response = await authApi.get(`/student/subjects/filter?grade=${grade}&syllabus=${syllabus}`);
    return response.data.data;
  },


  updateTrialClass: async (trialClassId: string, data: Partial<TrialClassRequest>): Promise<TrialClassResponse> => {
    const response = await authApi.patch(`/student/trial-classes/${trialClassId}`, data);
    return response.data.data;
  },
};
