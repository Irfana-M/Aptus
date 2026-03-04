export interface Student {
  _id: string;
  fullName: string;
  email: string;
}

export interface CourseGroup {
  key: string;
  subjectId: string;
  subjectName: string;
  gradeId: string;
  gradeName: string;
  syllabus: string;
  students: Student[];
}
