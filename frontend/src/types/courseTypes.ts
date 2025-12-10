export interface Course {
  _id: string;
  grade: { _id: string; name: string; syllabus: string };
  subject: { _id: string; subjectName: string };
  mentor: { _id: string; fullName: string; profilePicture?: string };
  dayOfWeek: number;
  timeSlot: string;
  startDate: string;
  endDate: string;
  fee: number;
  status: "available" | "booked" | "ongoing" | "completed" | "cancelled";
  isActive: boolean;
}