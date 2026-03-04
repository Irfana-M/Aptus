import { injectable } from "inversify";
import { AppError } from "../../utils/AppError.js";
import { HttpStatusCode } from "../../constants/httpStatus.js";
import type { TrialClassRequestDto } from "../../dtos/student/trialClassDTO.js";
import type { ITrialClassDocument } from "../../models/student/trialClass.model.js";
import { Types } from "mongoose";

@injectable()
export class TrialEligibilityPolicy {
  
  validateRequest(data: TrialClassRequestDto): void {
    const preferredDate = new Date(data.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preferredDate < today) {
      throw new AppError("Preferred date cannot be in the past", HttpStatusCode.BAD_REQUEST);
    }

    if (!data.preferredTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      throw new AppError("Invalid time format. Use HH:MM (24-hour)", HttpStatusCode.BAD_REQUEST);
    }
  }

  canUpdate(trial: ITrialClassDocument, actorId: string): void {
    if (!this.isStudent(trial, actorId)) {
        throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);
    }

    if (trial.status === "completed" || trial.status === "cancelled") {
      throw new AppError("Cannot update completed or cancelled trial class", HttpStatusCode.BAD_REQUEST);
    }
  }

  canSubmitFeedback(trial: ITrialClassDocument, actorId: string): void {
    if (!this.isStudent(trial, actorId)) {
      throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);
    }
 
  }

  canAssignMentor(trial: ITrialClassDocument): void {
      if (trial.status === 'cancelled') {
          throw new AppError("Cannot assign mentor to a cancelled trial class", HttpStatusCode.BAD_REQUEST);
      }
  }

  private isStudent(trial: ITrialClassDocument, actorId: string): boolean {
      if (!trial.student) return false;
      const studentId = trial.student instanceof Types.ObjectId 
        ? trial.student.toString() 
        : (trial.student as unknown as { _id?: { toString(): string } })._id?.toString() || 
          (typeof trial.student === 'string' ? trial.student : String(trial.student));
      return studentId === actorId;
  }
}
