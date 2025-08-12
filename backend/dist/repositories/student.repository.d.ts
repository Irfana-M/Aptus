import type { StudentRegisterInput } from '../interfaces/student.interface';
export declare const createStudent: (data: StudentRegisterInput) => Promise<import("mongoose").Document<unknown, {}, import("../interfaces/student.interface").Student, {}, {}> & import("../interfaces/student.interface").Student & Required<{
    _id: string;
}> & {
    __v: number;
}>;
//# sourceMappingURL=student.repository.d.ts.map