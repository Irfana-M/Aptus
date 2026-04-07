import { injectable } from "inversify";
import { AppError } from "../../utils/AppError";
import { HttpStatusCode } from "../../constants/httpStatus";
import type { IBooking } from "../../interfaces/models/booking.interface";

@injectable()
export class SessionAttendancePolicy {
  
  canMarkPresent(session: IBooking): void {
    if (session.status === 'cancelled') {
        throw new AppError("Cannot mark a cancelled session as present", HttpStatusCode.BAD_REQUEST);
    }
    
  }

  canMarkAbsent(session: IBooking): void {
      if (session.status === 'cancelled') {
        throw new AppError("Cannot mark a cancelled session as absent", HttpStatusCode.BAD_REQUEST);
    }
  }
}
