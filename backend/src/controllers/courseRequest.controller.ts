import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response, NextFunction } from 'express';
import type { ICourseRequestService } from '../interfaces/services/ICourseRequestService';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "admin" | "mentor" | "student";
    userId?: string; 
  }
}

@injectable()
export class CourseRequestController {
  constructor(
    @inject(TYPES.ICourseRequestService) private _service: ICourseRequestService
  ) {}
  
  public createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const studentId = authReq.user?.userId || authReq.user?.id;
      
      if (!studentId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { subject, mentoringMode, preferredDay, timeRange, timezone } = req.body;

     
      if (!subject || !mentoringMode || !preferredDay || !timeRange) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      const savedRequest = await this._service.createRequest(studentId, {
        subject,
        mentoringMode,
        preferredDay,
        timeRange,
        timezone,
      });

      res.status(201).json({
        message: 'Course request submitted successfully',
        data: savedRequest
      });
    } catch (error: any) {
      console.error('Error creating course request:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  
  public getAllRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requests = await this._service.getAllRequests();

      res.status(200).json({
        message: 'Course requests fetched successfully',
        data: requests
      });
    } catch (error: any) {
      console.error('Error fetching course requests:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  
  public getMyRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
          const authReq = req as AuthRequest;
          const studentId = authReq.user?.userId || authReq.user?.id;
          
          if (!studentId) {
              res.status(401).json({ message: 'Unauthorized' });
              return;
          }

          const requests = await this._service.getMyRequests(studentId);

          res.status(200).json({
              message: 'My course requests fetched successfully',
              data: requests
          });
      } catch (error: any) {
          console.error('Error fetching my course requests:', error);
          res.status(500).json({ message: 'Internal server error', error: error.message });
      }
  }

  
  public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
          res.status(400).json({ message: 'Request ID is required' });
          return;
      }

      const updatedRequest = await this._service.updateStatus(id, status);

      if (!updatedRequest) {
        res.status(404).json({ message: 'Request not found' });
        return;
      }

      res.status(200).json({
        message: 'Request status updated',
        data: updatedRequest
      });
    } catch (error: any) {
      console.error('Error updating request status:', error);
      if (error.message === "Invalid status") {
          res.status(400).json({ message: error.message });
          return;
      }
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
}

