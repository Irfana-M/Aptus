import type { IGrade } from "@/models/grade.model";
import type { IBaseRepository } from "./IBaseRepository";

export interface IGradeRepository extends IBaseRepository<IGrade> {
    findAllActive(): Promise<IGrade[]>;
    findBySyllabus(syllabus: string): Promise<IGrade[]>;
}