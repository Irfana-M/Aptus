import { Router } from "express";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService } from "../services/admin.service.js";
import { AdminController } from "../controllers/admin.controller.js";

const adminRouter = Router();


const adminRepo = new AdminRepository();
const adminService = new AdminService(adminRepo);
const adminController = new AdminController(adminService);


adminRouter.post("/login", adminController.login);
adminRouter.get("/dashboard", adminController.getDashboardData);


export default adminRouter;
