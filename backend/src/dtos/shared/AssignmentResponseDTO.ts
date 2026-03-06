export interface AssignmentResponseDto {
  _id: string;
  title: string;
  description?: string | undefined;
  dueDate: Date;
  status: "pending" | "submitted" | "completed" | "reviewed";
  subjectName?: string | undefined;
  mentorName?: string | undefined;
  studentName?: string | undefined;
  studentId?: string | undefined;
}
