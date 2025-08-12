import { registerStudent } from '../services/student.service.js';
export const studentRegister = async (req, res) => {
    try {
        const student = await registerStudent(req.body);
        res.status(201).json({ success: true, student });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'Something went wrong' });
        }
    }
};
//# sourceMappingURL=student.controller.js.map