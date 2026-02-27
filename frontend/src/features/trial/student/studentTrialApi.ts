import api from '../../../api/api';
import { API_ROUTES } from '../../../constants/apiRoutes';
import type { 
  TrialClassRequest, 
  TrialClassResponse, 
  FeedbackRequest, 
  Grade,
  Subject
} from '../../../types/trialTypes';

export const studentTrialApi = {
  requestTrialClass: async (data: TrialClassRequest): Promise<TrialClassResponse> => {
    const response = await api.post(API_ROUTES.STUDENT.TRIAL_CLASSES_REQUEST, data);
    return response.data.data;
  },

  getGradesByEducationType: async (educationType: string): Promise<Grade[]> => {
    const response = await api.get(`${API_ROUTES.STUDENT.GRADES_SYLLABUS}?syllabus=${educationType}`);
    return response.data.data;
  },

  getStudentTrialClasses: async (): Promise<TrialClassResponse[]> => {
    const response = await api.get(API_ROUTES.STUDENT.TRIAL_CLASSES);
    return response.data.data;
  },

  getTrialClassById: async (id: string): Promise<TrialClassResponse> => {
    const response = await api.get(API_ROUTES.STUDENT.TRIAL_CLASS_DETAILS.replace(":id", id));
    return response.data.data;
  },

  submitFeedback: async (trialClassId: string, feedback: FeedbackRequest): Promise<TrialClassResponse> => {
    const response = await api.post(API_ROUTES.STUDENT.TRIAL_CLASS_FEEDBACK.replace(":trialClassId", trialClassId), feedback);
    return response.data.data;
  },

  cancelTrialClass: async (trialClassId: string): Promise<TrialClassResponse> => {
    const response = await api.patch(API_ROUTES.STUDENT.TRIAL_CLASS_CANCEL.replace(":trialClassId", trialClassId));
    return response.data.data;
  },

  getGrades: async (): Promise<Grade[]> => {
    const response = await api.get(API_ROUTES.STUDENT.GRADES);
    return response.data.data;
  },

  getSubjectsByGrade: async (gradeId: string): Promise<Subject[]> => {
    const response = await api.get(`${API_ROUTES.STUDENT.SUBJECTS}?grade=${gradeId}`);
    return response.data.data;
  },


  getSubjectsByGradeAndSyllabus: async (grade: number, syllabus: string): Promise<Subject[]> => {
    const response = await api.get(`${API_ROUTES.STUDENT.SUBJECTS_FILTER}?grade=${grade}&syllabus=${syllabus}`);
    return response.data.data;
  },


  updateTrialClass: async (trialClassId: string, data: Partial<TrialClassRequest>): Promise<TrialClassResponse> => {
    const response = await api.patch(API_ROUTES.STUDENT.TRIAL_CLASS_DETAILS.replace(":id", trialClassId), data);
    return response.data.data;
  },

  completeTrialClass: async (trialClassId: string): Promise<TrialClassResponse> => {
    const response = await api.put(API_ROUTES.TRIAL_CLASSES.COMPLETE.replace(":id", trialClassId));
    return response.data.data;
  },

  getAvailableTrialSlots: async (subjectId: string, date: string): Promise<{ slots: unknown[], hasAvailability: boolean }> => {
    const response = await api.get(`${API_ROUTES.STUDENT.TRIAL_CLASSES_AVAILABLE_SLOTS}?subject=${subjectId}&date=${date}`);
    return response.data.data;
  },
};
