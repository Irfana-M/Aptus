import type { IGrade } from "@/models/grade.model";

export interface IGradeRepository {
    findAllActive(): Promise<IGrade[]>;
    findBySyllabus(syllabus: string): Promise<IGrade[]>;
    findById(id: string): Promise<IGrade | null>;
}