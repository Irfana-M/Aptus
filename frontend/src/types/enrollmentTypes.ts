import type { Course } from "./courseTypes";

export interface Enrollment {
  _id: string;
  student: {
    _id: string;
    fullName: string;
    email: string;
    profilePicture?: string;
  };
  course: Course;
  enrollmentDate: string;
  status: "pending_payment" | "active" | "cancelled";
  createdAt: string;
  updatedAt: string;
}
