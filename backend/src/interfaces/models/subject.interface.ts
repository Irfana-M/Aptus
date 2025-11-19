export interface ISubject {
  _id?: string;
  syllabus: "CBSE" | "STATE" | "ICSE";
  grade: number;
  subjectName: string;
}
