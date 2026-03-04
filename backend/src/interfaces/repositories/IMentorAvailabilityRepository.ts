import type { IMentorAvailability } from "../models/mentorAvailability.interface.js";
import type { IBaseRepository } from "./IBaseRepository.js";
import type { FilterQuery, UpdateQuery, QueryOptions } from "mongoose";

export interface IMentorAvailabilityRepository extends IBaseRepository<IMentorAvailability> {
  deleteMany(filter: FilterQuery<IMentorAvailability>): Promise<unknown>;
  findOneAndUpdate(filter: FilterQuery<IMentorAvailability>, update: UpdateQuery<IMentorAvailability>, options?: QueryOptions): Promise<IMentorAvailability | null>;
  findActiveByMentor(mentorId: string): Promise<IMentorAvailability[]>;
}
