import type { IGrade } from "@/models/grade.model.js";
import type { IBaseRepository } from "./IBaseRepository.js";

export interface IGradeRepository extends IBaseRepository<IGrade> {
    findAllActive(): Promise<IGrade[]>;
    findBySyllabus(syllabus: string): Promise<IGrade[]>;
}