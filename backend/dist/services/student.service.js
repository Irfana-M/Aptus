import { createStudent } from '../repositories/student.repository.js';
import bcrypt from 'bcryptjs';
export const registerStudent = async (data) => {
    const { email, password, fullName, phone } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = {
        email,
        password: hashedPassword,
        fullName,
        phone
    };
    return await createStudent(newStudent);
};
//# sourceMappingURL=student.service.js.map