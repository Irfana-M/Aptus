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
  
  public createRequest = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const studentId = authReq.user?.userId || authReq.user?.id;
      
      console.log('📝 [DEBUG] createRequest called');
      console.log('📝 [DEBUG] Body:', req.body);
      console.log('📝 [DEBUG] StudentID:', studentId);

      if (!studentId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { subject, grade, mentoringMode, preferredDays, timeSlot, timeRange, timezone, mentorId } = req.body;

      // Handle both timeSlot and timeRange for compatibility
      const finalTimeSlot = timeSlot || timeRange;

      if (!subject || !grade || !mentoringMode || !preferredDays || !finalTimeSlot) {
        console.error('❌ [DEBUG] Missing required fields', { subject, grade, mentoringMode, preferredDays, finalTimeSlot });
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }
      
      if (!Array.isArray(preferredDays) || preferredDays.length === 0) {
           console.error('❌ [DEBUG] preferredDays must be a non-empty array');
           res.status(400).json({ message: 'At least one preferred day is required' });
           return;
      }

      const requestData = {
        subject,
        grade,
        mentoringMode,
        preferredDays,
        timeSlot: finalTimeSlot,
        timezone,
        mentor: mentorId 
      };
      
      console.log('📝 [DEBUG] Data to service:', requestData);

      const savedRequest = await this._service.createRequest(studentId, requestData);

      console.log('✅ [DEBUG] Saved request:', savedRequest);

      res.status(201).json({
        message: 'Course request submitted successfully',
        data: savedRequest
      });
    } catch (error: unknown) {
      console.error('❌ [DEBUG] Error creating course request:', error);
      if (error instanceof Error && error.name === 'ValidationError') {
           res.status(400).json({ message: 'Validation Error', error: error.message });
           return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Internal server error', error: message });
    }
  }

  
  public getAllRequests = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const requests = await this._service.getAllRequests();

      res.status(200).json({
        message: 'Course requests fetched successfully',
        data: requests
      });
    } catch (error: unknown) {
      console.error('Error fetching course requests:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Internal server error', error: message });
    }
  }

  
  public getMyRequests = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
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
      } catch (error: unknown) {
        console.error('Error fetching my course requests:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Internal server error', error: message });
    }
  }

  
  public updateStatus = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
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
    } catch (error: unknown) {
      console.error('Error updating request status:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      if (message === "Invalid status") {
          res.status(400).json({ message });
          return;
      }
      res.status(500).json({ message: 'Internal server error', error: message });
    }
  }
}

