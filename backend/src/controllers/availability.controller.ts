
import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { Request, Response, NextFunction } from "express";
import type { IAvailabilityService } from "../interfaces/services/IAvailabilityService.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { MESSAGES } from "@/constants/messages.constants.js";
import { logger } from "../utils/logger.js";

@injectable()
export class AvailabilityController {
  constructor(
    @inject(TYPES.IAvailabilityService) private _service: IAvailabilityService
  ) {}

  public updateAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mentorId } = req.params;
      if (!mentorId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.COMMON.ID_REQUIRED("Mentor") });
        return;
      }
      const { schedule } = req.body;
      
      
      const updatedMentorProfile = await this._service.updateAvailability(mentorId, schedule);
      res.status(HttpStatusCode.ACCEPTED).json({ message: MESSAGES.ADMIN.AVAILABILITY_UPDATE_SUCCESS, data: updatedMentorProfile.availability });
    } catch (error) {
       next(error);
    }
  }

  public getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mentorId } = req.params;
      if (!mentorId) throw new Error(MESSAGES.COMMON.ID_REQUIRED("Mentor"));
      const mentorAvailability = await this._service.getAvailability(mentorId);
      res.status(HttpStatusCode.OK).json({ data: mentorAvailability });
    } catch (error) {
      next(error);
    }
  }

  public findMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { subject, grade, days, timeSlot } = req.query;
        logger.info(`📡 [API] Finding matching mentors for Subject: ${subject}, Grade: ${grade}`);
        
        
        if (!subject) {
            res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.ADMIN.REQUIRED_PARAMETER("subject") });
            return;
        }

        const daysArray = days 
            ? (Array.isArray(days) ? days as string[] : (days as string).split(','))
            : [];

        const matchedMentors = await this._service.findMatchingMentors(
            subject as string, 
            (grade as string) || "", 
            daysArray, 
            (timeSlot as string) || ""
        );

        logger.info(`✅ [API] Found ${matchedMentors.matches.length} direct matches and ${matchedMentors.alternates.length} alternates`);
        res.status(HttpStatusCode.OK).json({ data: matchedMentors });
    } catch (error) {
        next(error);
    }
  }

  public getPublicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
          const { mentorId } = req.params;
          if (!mentorId) {
              res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.COMMON.ID_REQUIRED("Mentor") });
              return;
          }
          const profile = await this._service.getPublicProfile(mentorId);
          res.status(HttpStatusCode.OK).json({ data: profile });
      } catch (error) {
          next(error);
      }
  }
}
