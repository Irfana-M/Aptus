import api from "../../api/api";

export const enrollInCourse = async (courseId: string) => {
  const response = await api.post(`/enrollments/enroll/${courseId}`);
  return response.data;
};

export const getMyEnrollments = async () => {
  const response = await api.get("/enrollments/my-enrollments");
  return response.data;
};
