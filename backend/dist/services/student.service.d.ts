import type { StudentRegisterInput } from '../interfaces/student.interface.js';
export declare const registerStudent: (data: StudentRegisterInput) => Promise<import("mongoose").Document<unknown, {}, import("../interfaces/student.interface.js").Student, {}, {}> & import("../interfaces/student.interface.js").Student & Required<{
    _id: string;
}> & {
    __v: number;
}>;
//# sourceMappingURL=student.service.d.ts.map