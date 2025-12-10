// import { injectable } from "inversify";
// import { TrialClass, type ITrialClassDocument } from "@/models/student/trialClass.model";
// import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
// import { logger } from "@/utils/logger";
// import { Types } from "mongoose";
// import { HttpStatusCode } from "@/constants/httpStatus";
// import { AppError } from "@/utils/AppError";

// @injectable()
// export class TrialClassRepository implements ITrialClassRepository {
//   async create(data: {
//     student: string;
//     subject: string;
//     preferredDate: Date;
//     preferredTime: string;
//     status?: "requested" | "assigned" | "completed";
//   }): Promise<ITrialClassDocument> {
//     logger.info("Creating new trial class request");
    
//     const trialClass = new TrialClass({
//       student: new Types.ObjectId(data.student),
//       subject: new Types.ObjectId(data.subject),
//       preferredDate: data.preferredDate,
//       preferredTime: data.preferredTime,
//       status: data.status || "requested",
//     });

//     const saved = await trialClass.save();
//     return saved;
//   }

//   async findById(id: string): Promise<ITrialClassDocument | null> {
//     logger.info(`Fetching trial class by ID: ${id}`);
//     return await TrialClass.findById(id)
//       .populate("student")
//       .populate("subject")
//       .populate("mentor")
//       .exec();
//   }

// async findByStudentId(studentId: string, status?: string): Promise<ITrialClassDocument[]> {
//   try {
//     console.log('🔍 [DEBUG] TrialClassRepository.findByStudentId - START');
//     console.log('🔍 [DEBUG] Input parameters:', { studentId, status });
    
    
//     console.log('🔍 [DEBUG] Original studentId:', studentId);
//     console.log('🔍 [DEBUG] Is valid ObjectId:', Types.ObjectId.isValid(studentId));
    
//     const studentObjectId = new Types.ObjectId(studentId);
//     console.log('🔍 [DEBUG] Converted ObjectId:', studentObjectId);
//     console.log('🔍 [DEBUG] ObjectId string:', studentObjectId.toString());

   
//     const query: any = { student: studentObjectId };
//     console.log('🔍 [DEBUG] Base query:', JSON.stringify(query));
    
//     if (status) {
//       query.status = status;
//       console.log('🔍 [DEBUG] Query with status:', JSON.stringify(query));
//     }

//     console.log('🔍 [DEBUG] Final query:', JSON.stringify(query));
    
   
//     console.log('🔍 [DEBUG] Executing TrialClass.find()...');
//     const findResult = await TrialClass.find(query);
//     console.log('🔍 [DEBUG] Raw find result (before populate):', findResult);
//     console.log('🔍 [DEBUG] Raw find result length:', findResult.length);
    
//     if (findResult.length > 0 && findResult[0]) {
//       console.log('🔍 [DEBUG] First raw document:', findResult[0]);
//       console.log('🔍 [DEBUG] Student field in raw doc:', findResult[0].student);
//       console.log('🔍 [DEBUG] Student field type:', typeof findResult[0].student);
//     }

    
//     console.log('🔍 [DEBUG] Starting populate operations...');
    
//     const trialClasses = await TrialClass.find(query)
//       .populate("student", "fullName email phoneNumber")
//       .populate("subject", "subjectName syllabus grade")
//       .populate("mentor", "fullName email")
//       .sort({ createdAt: -1 })
//       .exec();

//     console.log('🔍 [DEBUG] Final result after populate:', trialClasses);
//     console.log('🔍 [DEBUG] Final result length:', trialClasses.length);
    
    
//     if (trialClasses.length > 0 && trialClasses[0]) {
//       const firstTrialClass = trialClasses[0];
//       console.log('🔍 [DEBUG] First populated document:');
//       console.log('  - _id:', firstTrialClass._id);
      
      
//       const firstClassAny = firstTrialClass as any;
      
//       console.log('  - student:', firstClassAny.student ? 'POPULATED' : 'NULL/UNDEFINED');
//       if (firstClassAny.student) {
//         console.log('    * fullName:', firstClassAny.student.fullName);
//         console.log('    * email:', firstClassAny.student.email);
//         console.log('    * phoneNumber:', firstClassAny.student.phoneNumber);
//       }
      
//       console.log('  - subject:', firstClassAny.subject ? 'POPULATED' : 'NULL/UNDEFINED');
//       if (firstClassAny.subject) {
//         console.log('    * subjectName:', firstClassAny.subject.subjectName);
//         console.log('    * syllabus:', firstClassAny.subject.syllabus);
//         console.log('    * grade:', firstClassAny.subject.grade);
//       }
      
//       console.log('  - mentor:', firstClassAny.mentor ? 'POPULATED' : 'NULL/UNDEFINED');
//       if (firstClassAny.mentor) {
//         console.log('    * fullName:', firstClassAny.mentor.fullName);
//         console.log('    * email:', firstClassAny.mentor.email);
//       }
      
//       console.log('  - status:', firstTrialClass.status);
//       console.log('  - preferredDate:', firstTrialClass.preferredDate);
//     } else {
//       console.log('❌ [DEBUG] No trial classes found for this query');
      
      
//       console.log('🔍 [DEBUG] Checking all trial classes in database...');
//       const allTrialClasses = await TrialClass.find({});
//       console.log('🔍 [DEBUG] Total trial classes in DB:', allTrialClasses.length);
//       allTrialClasses.forEach((tc, index) => {
//         if (tc) { 
//           console.log(`  ${index + 1}. _id: ${tc._id}, student: ${tc.student}, status: ${tc.status}`);
//         }
//       });
//     }

//     console.log(`✅ [DEBUG] Trial classes for the student: ${trialClasses.length} found`);
//     logger.info(`TrialClassRepository: Found ${trialClasses.length} trial classes for student ${studentId}`);
    
//     console.log('🔍 [DEBUG] TrialClassRepository.findByStudentId - END');
//     return trialClasses;
//   } catch (error: any) {
//     console.error('❌ [DEBUG] TrialClassRepository.findByStudentId - ERROR:', error);
//     console.error('❌ [DEBUG] Error stack:', error.stack);
    
//     logger.error(`TrialClassRepository: Error fetching trial classes for student ${studentId}`, error);
//     throw new AppError(
//       "Failed to fetch student trial classes",
//       HttpStatusCode.INTERNAL_SERVER_ERROR
//     );
//   }
// }



//   async update(id: string, updates: Partial<ITrialClassDocument>): Promise<ITrialClassDocument | null> {
//     logger.info(`Updating trial class ${id}`);
    
    
//     const updateData: any = { ...updates };
//     if (updates.mentor && typeof updates.mentor === 'string') {
//       updateData.mentor = new Types.ObjectId(updates.mentor);
//     }
    
//     return await TrialClass.findByIdAndUpdate(id, updateData, { 
//       new: true 
//     })
//     .populate("subject")
//     .populate("mentor")
//     .exec();
//   }



//    async delete(id: string): Promise<boolean> {
//     try {
//       logger.info(`TrialClassRepository: Deleting trial class - ${id}`);

//       const result = await TrialClass.findByIdAndDelete(id);
//       const success = !!result;

//       logger.info(`TrialClassRepository: Trial class deletion ${success ? 'successful' : 'failed'} - ${id}`);
//       return success;
//     } catch (error) {
//       logger.error(`TrialClassRepository: Error deleting trial class ${id}`, error);
//       throw new AppError(
//         "Failed to delete trial class",
//         HttpStatusCode.INTERNAL_SERVER_ERROR
//       );
//     }
//   }


//   async findAll(filters: { status?: string; page?: number; limit?: number }): Promise<{ trialClasses: ITrialClassDocument[]; total: number }> {
//     try {
//       const { status, page = 1, limit = 10 } = filters;
//       const skip = (page - 1) * limit;

//       logger.info("TrialClassRepository: Fetching all trial classes", { status, page, limit });

//       const query: any = {};
//       if (status) {
//         query.status = status;
//       }

//       const [trialClasses, total] = await Promise.all([
//         TrialClass.find(query)
//           .populate("student", "fullName email phoneNumber")
//           .populate("subject", "name description syllabus grade")
//           .populate("mentor", "fullName email expertise")
//           .sort({ createdAt: -1 })
//           .skip(skip)
//           .limit(limit)
//           .exec(),
//         TrialClass.countDocuments(query)
//       ]);

//       logger.info(`TrialClassRepository: Found ${trialClasses.length} trial classes`);
      
//       return { trialClasses, total };
//     } catch (error) {
//       logger.error("TrialClassRepository: Error fetching all trial classes", error);
//       throw new AppError(
//         "Failed to fetch trial classes",
//         HttpStatusCode.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   async assignMentor(trialClassId: string, mentorId: string, updates: Partial<ITrialClassDocument>): Promise<ITrialClassDocument | null> {
//     try {
//       logger.info(`TrialClassRepository: Assigning mentor to trial class - ${trialClassId}`, { mentorId });

//       const updateData = {
//         mentor: new Types.ObjectId(mentorId),
//         status: "assigned" as const,
//         ...updates
//       };

//       const updatedTrialClass = await TrialClass.findByIdAndUpdate(
//         trialClassId,
//         updateData,
//         { new: true, runValidators: true }
//       )
//       .populate("student", "fullName email phoneNumber")
//       .populate("subject", "name description syllabus grade")
//       .populate("mentor", "fullName email expertise")
//       .exec();

//       if (!updatedTrialClass) {
//         logger.warn(`TrialClassRepository: Trial class not found for mentor assignment - ${trialClassId}`);
//         return null;
//       }

//       logger.info(`TrialClassRepository: Successfully assigned mentor to trial class - ${trialClassId}`);
//       return updatedTrialClass;
//     } catch (error) {
//       logger.error(`TrialClassRepository: Error assigning mentor to trial class ${trialClassId}`, error);
//       throw new AppError(
//         "Failed to assign mentor to trial class",
//         HttpStatusCode.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   async updateStatus(trialClassId: string, status: string, reason?: string): Promise<ITrialClassDocument | null> {
//     try {
//       logger.info(`TrialClassRepository: Updating trial class status - ${trialClassId}`, { status, reason });

//       const updateData: any = { status };
//       if (reason && status === 'cancelled') {
//         updateData.cancellationReason = reason;
//       }

//       const updatedTrialClass = await TrialClass.findByIdAndUpdate(
//         trialClassId,
//         updateData,
//         { new: true, runValidators: true }
//       )
//       .populate("student", "fullName email phoneNumber")
//       .populate("subject", "name description syllabus grade")
//       .populate("mentor", "fullName email expertise")
//       .exec();

//       if (!updatedTrialClass) {
//         logger.warn(`TrialClassRepository: Trial class not found for status update - ${trialClassId}`);
//         return null;
//       }

//       logger.info(`TrialClassRepository: Successfully updated trial class status - ${trialClassId}`);
//       return updatedTrialClass;
//     } catch (error) {
//       logger.error(`TrialClassRepository: Error updating trial class status ${trialClassId}`, error);
//       throw new AppError(
//         "Failed to update trial class status",
//         HttpStatusCode.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//     async getStudentTrialStats(studentId: string): Promise<{ total: number; pending: number }> {
//     try {
//       logger.info(`TrialClassRepository: Fetching trial stats for student - ${studentId}`);

//       const [totalResult, pendingResult] = await Promise.all([
//         TrialClass.countDocuments({ student: new Types.ObjectId(studentId) }),
//         TrialClass.countDocuments({ 
//           student: new Types.ObjectId(studentId),
//           status: { $in: ["requested", "assigned"] }
//         })
//       ]);

//       const stats = {
//         total: totalResult,
//         pending: pendingResult
//       };

//       logger.info(`TrialClassRepository: Student trial stats for ${studentId}`, stats);
//       return stats;
//     } catch (error) {
//       logger.error(`TrialClassRepository: Error fetching trial stats for student ${studentId}`, error);
//       throw new AppError(
//         "Failed to fetch student trial statistics",
//         HttpStatusCode.INTERNAL_SERVER_ERROR
//       );
//     }
//   }


//   async findByStatus(status: string, page: number = 1, limit: number = 10): Promise<{ trialClasses: ITrialClassDocument[]; total: number }> {
//   try {
//     logger.info(`TrialClassRepository: Fetching trial classes with status - ${status}`, { page, limit });

//     const skip = (page - 1) * limit;

//     const [trialClasses, total] = await Promise.all([
//       TrialClass.find({ status })
//         .populate("student", "fullName email phoneNumber")
//         .populate("subject", "name description syllabus grade")
//         .populate("mentor", "fullName email expertise")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .exec(),
//       TrialClass.countDocuments({ status })
//     ]);

//     logger.info(`TrialClassRepository: Found ${trialClasses.length} trial classes with status ${status}`);
    
//     return { trialClasses, total };
//   } catch (error) {
//     logger.error(`TrialClassRepository: Error fetching trial classes with status ${status}`, error);
//     throw new AppError(
//       "Failed to fetch trial classes by status",
//       HttpStatusCode.INTERNAL_SERVER_ERROR
//     );
//   }
// }
//   async findByMentorId(mentorId: string): Promise<ITrialClassDocument[]> {
//     try {
//       logger.info(`Fetching trial classes for mentor: ${mentorId}`);
//       return await TrialClass.find({ mentor: new Types.ObjectId(mentorId) })
//         .populate("student", "fullName email phoneNumber")
//         .populate("subject", "subjectName syllabus grade")
//         .sort({ preferredDate: 1 })
//         .exec();
//     } catch (error) {
//       logger.error(`Error fetching trial classes for mentor ${mentorId}`, error);
//       throw new AppError(
//         "Failed to fetch mentor trial classes",
//         HttpStatusCode.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   async findTodayTrialClasses(mentorId: string): Promise<ITrialClassDocument[]> {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     return await TrialClass.find({
//       mentor: new Types.ObjectId(mentorId),
//       preferredDate: {
//         $gte: today,
//         $lt: tomorrow
//       },
//       status: "assigned"
//     })
//     .populate("student", "fullName email phoneNumber profilePicture")
//     .populate("subject", "subjectName grade")
//     .sort({ preferredTime: 1 })
//     .exec();
//   } catch (error) {
//     logger.error(`Error fetching today's trial classes for mentor ${mentorId}`, error);
//     throw new AppError("Failed to fetch today's classes", HttpStatusCode.INTERNAL_SERVER_ERROR);
//   }
// }
// }


// src/repositories/trialClass.repository.ts

import { injectable } from "inversify";
import { TrialClass, type ITrialClassDocument } from "@/models/student/trialClass.model";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import { logger } from "@/utils/logger";
import { Types } from "mongoose";
import { HttpStatusCode } from "@/constants/httpStatus";
import { AppError } from "@/utils/AppError";

@injectable()
export class TrialClassRepository implements ITrialClassRepository {
  // CREATE
  async create(data: {
    student: string;
    subject: string;
    preferredDate: Date;
    preferredTime: string;
    status?: "requested" | "assigned" | "completed" | "cancelled";
  }): Promise<ITrialClassDocument> {
    logger.info("Creating new trial class request");

    const trialClass = new TrialClass({
      student: new Types.ObjectId(data.student),
      subject: new Types.ObjectId(data.subject),
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      status: data.status || "requested",
    });

    const saved = await trialClass.save();
    return saved;
  }

  // FIND BY ID (with populate)
  async findById(id: string): Promise<ITrialClassDocument | null> {
    return await TrialClass.findById(id)
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate("subject", "subjectName syllabus grade")
      .populate("mentor", "fullName email")
      .exec();
  }

  // FIND BY STUDENT
  async findByStudentId(studentId: string, status?: string): Promise<ITrialClassDocument[]> {
    const query: any = { student: new Types.ObjectId(studentId) };
    if (status) query.status = status;

    return await TrialClass.find(query)
      .populate("student", "fullName email phoneNumber")
      .populate("subject", "subjectName syllabus grade")
      .populate("mentor", "fullName email")
      .sort({ createdAt: -1 })
      .exec();
  }

  // FIND BY MENTOR (ALL)
  async findByMentorId(mentorId: string): Promise<ITrialClassDocument[]> {
    return await TrialClass.find({ mentor: new Types.ObjectId(mentorId) })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate("subject", "subjectName syllabus grade")
      .sort({ preferredDate: 1, preferredTime: 1 })
      .exec();
  }

  // FIND TODAY'S SESSIONS FOR MENTOR ← This is the key method
  async findTodayTrialClasses(mentorId: string): Promise<ITrialClassDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await TrialClass.find({
      mentor: new Types.ObjectId(mentorId),
      preferredDate: { $gte: today, $lt: tomorrow },
      status: "assigned"
    })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate("subject", "subjectName grade")
      .sort({ preferredTime: 1 })
      .exec();
  }

  // UPDATE
  async update(id: string, updates: Partial<ITrialClassDocument>): Promise<ITrialClassDocument | null> {
    const updateData: any = { ...updates };

    if (updates.mentor && typeof updates.mentor === "string") {
      updateData.mentor = new Types.ObjectId(updates.mentor);
    }

    return await TrialClass.findByIdAndUpdate(id, updateData, { new: true })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate("subject", "subjectName syllabus grade")
      .populate("mentor", "fullName email")
      .exec();
  }

  // DELETE
  async delete(id: string): Promise<boolean> {
    const result = await TrialClass.findByIdAndDelete(id);
    return !!result;
  }

  // ASSIGN MENTOR
  async assignMentor(
    trialClassId: string,
    mentorId: string,
    updates: Partial<ITrialClassDocument> = {}
  ): Promise<ITrialClassDocument | null> {
    const updateData = {
      mentor: new Types.ObjectId(mentorId),
      status: "assigned" as const,
      ...updates,
    };

    return await TrialClass.findByIdAndUpdate(trialClassId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate("subject", "subjectName syllabus grade")
      .populate("mentor", "fullName email")
      .exec();
  }

  // UPDATE STATUS (cancelled, completed, etc.)
  async updateStatus(
    trialClassId: string,
    status: "requested" | "assigned" | "completed" | "cancelled",
    reason?: string
  ): Promise<ITrialClassDocument | null> {
    const updateData: any = { status };
    if (reason && status === "cancelled") {
      updateData.cancellationReason = reason;
    }

    return await TrialClass.findByIdAndUpdate(trialClassId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate("subject", "subjectName syllabus grade")
      .populate("mentor", "fullName email")
      .exec();
  }

  // STATS
  async getStudentTrialStats(studentId: string): Promise<{ total: number; pending: number }> {
    const [total, pending] = await Promise.all([
      TrialClass.countDocuments({ student: new Types.ObjectId(studentId) }),
      TrialClass.countDocuments({
        student: new Types.ObjectId(studentId),
        status: { $in: ["requested", "assigned"] },
      }),
    ]);

    return { total, pending };
  }

  // PAGINATED FIND ALL
  async findAll(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ trialClasses: ITrialClassDocument[]; total: number }> {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const query: any = status ? { status } : {};

    const [trialClasses, total] = await Promise.all([
      TrialClass.find(query)
        .populate("student", "fullName email phoneNumber")
        .populate("subject", "subjectName syllabus grade")
        .populate("mentor", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      TrialClass.countDocuments(query),
    ]);

    return { trialClasses, total };
  }


    async findByStatus(status: string, page: number = 1, limit: number = 10): Promise<{ trialClasses: ITrialClassDocument[]; total: number }> {
  try {
    logger.info(`TrialClassRepository: Fetching trial classes with status - ${status}`, { page, limit });

    const skip = (page - 1) * limit;

    const [trialClasses, total] = await Promise.all([
      TrialClass.find({ status })
        .populate("student", "fullName email phoneNumber")
        .populate("subject", "name description syllabus grade")
        .populate("mentor", "fullName email expertise")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      TrialClass.countDocuments({ status })
    ]);

    logger.info(`TrialClassRepository: Found ${trialClasses.length} trial classes with status ${status}`);
    
    return { trialClasses, total };
  } catch (error) {
    logger.error(`TrialClassRepository: Error fetching trial classes with status ${status}`, error);
    throw new AppError(
      "Failed to fetch trial classes by status",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}
}