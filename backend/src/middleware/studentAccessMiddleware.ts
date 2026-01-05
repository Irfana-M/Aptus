import type { Request, Response, NextFunction } from "express";
import { AccessState, ACCESS_STATE_HIERARCHY } from "../constants/accessControl";
import { StudentAccessResolver } from "../utils/StudentAccessResolver";
import { HttpStatusCode } from "../constants/httpStatus";
import { logger } from "../utils/logger";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";

export const requireAccess = (minState: AccessState) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || user.role !== 'student') {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Student access required"
      });
    }

    try {
      // Fetch fresh student data to ensure flags are accurate
      const studentRepo = container.get<IStudentRepository>(TYPES.IStudentRepository);
      const student = await studentRepo.findById(user.id);

      if (!student) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Student profile not found"
        });
      }

      // Resolve the current state of the student
      const currentState = StudentAccessResolver.resolve(student as any);
      
      const currentWeight = ACCESS_STATE_HIERARCHY[currentState];
      const requiredWeight = ACCESS_STATE_HIERARCHY[minState];

      if (currentWeight < requiredWeight) {
        logger.warn(`Access Denied: Student ${user.id} at stage ${currentState} attempted to access ${minState} route.`);
        
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: `Access level '${minState}' required.`,
          accessState: currentState,
          requiredState: minState,
          redirectUrl: getRecommendedRedirect(currentState)
        });
      }

      // Attach student and access state to request for potential use in controllers
      (req as any).student = student;
      (req as any).accessState = currentState;

      next();
    } catch (error) {
      logger.error("Error in studentAccessMiddleware:", error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error verifying student access permissions"
      });
    }
  };
};

function getRecommendedRedirect(state: AccessState): string {
  switch (state) {
    case AccessState.EMAIL_VERIFICATION: return '/verify-email';
    case AccessState.PROFILE_COMPLETION: return '/complete-profile';
    case AccessState.TRIAL_BOOKING: return '/book-trial';
    case AccessState.PAYMENT_REQUIRED: return '/subscription';
    default: return '/dashboard';
  }
}
