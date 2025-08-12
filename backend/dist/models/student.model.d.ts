import mongoose from 'mongoose';
import type { Student } from '../interfaces/student.interface.js';
export declare const StudentModel: mongoose.Model<Student, {}, {}, {}, mongoose.Document<unknown, {}, Student, {}, {}> & Student & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=student.model.d.ts.map