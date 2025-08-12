import express from 'express';
import { studentRegister } from '../controllers/student.controller.js';
const router = express.Router();
router.post('/register', studentRegister);
export default router;
//# sourceMappingURL=student.routes.js.map