import type { Request, Response, NextFunction } from "express";
import type { IAdminService } from "../interfaces/services/IAdminService.js";

export class AdminController {
  constructor(private _adminService: IAdminService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      console.log(email,password);
      const result = await this._adminService.login(email, password);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };


  getDashboardData = async (req: Request, res: Response) => {
  try {
    const data = await this._adminService.getDashboardData();
    console.log(data);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};
}
