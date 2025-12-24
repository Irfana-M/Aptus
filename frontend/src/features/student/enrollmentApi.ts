import api from "../../api/api";
import { API_ROUTES } from "../../constants/apiRoutes";

export const enrollInCourse = async (courseId: string) => {
  const response = await api.post(API_ROUTES.ENROLLMENTS.ENROLL.replace(":courseId", courseId));
  return response.data;
};

export const getMyEnrollments = async () => {
  const response = await api.get(API_ROUTES.ENROLLMENTS.MY_ENROLLMENTS);
  return response.data;
};
