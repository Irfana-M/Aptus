export interface Course {
  _id: string;
  grade: { _id: string; name: string; syllabus: string };
  subject: { _id: string; subjectName: string };
  mentor: { _id: string; fullName: string; profilePicture?: string; profileImageUrl?: string };
  student?: { 
    _id: string; 
    fullName: string; 
    email?: string;
    profilePicture?: string;
    profileImageUrl?: string;
  };
  dayOfWeek?: number;
  timeSlot: string;
  schedule?: {
    days: string[];
    timeSlot: string;
    slots?: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
  startDate: string;
  endDate: string;
  fee: number;
  status: "available" | "booked" | "ongoing" | "completed" | "cancelled";
  isActive: boolean;
  courseType?: "one-to-one" | "group";
  maxStudents?: number;
  enrolledStudents?: number;
  enrolledStudentsList?: {
    _id: string;
    fullName: string;
    email?: string;
    profilePicture?: string;
    profileImageUrl?: string;
  }[];
}