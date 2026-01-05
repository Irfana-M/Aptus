
import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response, NextFunction } from "express";
import type { IAvailabilityService } from "../interfaces/services/IAvailabilityService";

@injectable()
export class AvailabilityController {
  constructor(
    @inject(TYPES.IAvailabilityService) private service: IAvailabilityService
  ) {}

  public updateAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mentorId } = req.params;
      if (!mentorId) {
        res.status(400).json({ message: "Mentor ID is required" });
        return;
      }
      const { schedule } = req.body;
      
      // console.log(`[AvailabilityController] Updating availability for mentor: ${mentorId}`); // Removed debug log
      // console.log(`[AvailabilityController] Payload schedule:`, JSON.stringify(schedule, null, 2)); // Removed debug log

      // TODO: Add validation for schedule structure
      const updatedProfile = await this.service.updateAvailability(mentorId, schedule);
      res.status(200).json({ message: "Availability updated successfully", data: updatedProfile.availability });
    } catch (error) {
       next(error);
    }
  }

  public getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mentorId } = req.params;
      if (!mentorId) throw new Error("Mentor ID is required");
      const availability = await this.service.getAvailability(mentorId);
      res.status(200).json({ data: availability });
    } catch (error) {
      next(error);
    }
  }

  public findMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Query params: subject, grade, days (comma separated?), timeSlot
        const { subject, grade, days, timeSlot } = req.query;
        
        // Grade, days, and timeSlot are optional for finding mentors by subject (Discovery)
        if (!subject) {
            res.status(400).json({ message: "Missing required query parameter: subject" });
            return;
        }

        const daysArray = days 
            ? (Array.isArray(days) ? days as string[] : (days as string).split(','))
            : [];

        const mentors = await this.service.findMatchingMentors(
            subject as string, 
            (grade as string) || "", 
            daysArray, 
            (timeSlot as string) || ""
        );

        res.status(200).json({ data: mentors });
    } catch (error) {
        next(error);
    }
  }

  public getPublicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
          const { mentorId } = req.params;
          if (!mentorId) {
              res.status(400).json({ message: "Mentor ID is required" });
              return;
          }
          const profile = await this.service.getPublicProfile(mentorId);
          res.status(200).json({ data: profile });
      } catch (error) {
          next(error);
      }
  }
}
