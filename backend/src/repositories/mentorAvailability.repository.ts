import { injectable } from "inversify";
import mongoose from "mongoose";
import { BaseRepository } from "./baseRepository.js";
import { MentorAvailabilityModel } from "../models/mentor/mentorAvailability.model.js";
import type { IMentorAvailability } from "../interfaces/models/mentorAvailability.interface.js";
import type { IMentorAvailabilityRepository } from "../interfaces/repositories/IMentorAvailabilityRepository.js";

@injectable()
export class MentorAvailabilityRepository extends BaseRepository<IMentorAvailability> implements IMentorAvailabilityRepository {
  constructor() {
    super(MentorAvailabilityModel);
  }

  async findActiveByMentor(mentorId: string): Promise<IMentorAvailability[]> {
    return await this.model.find({ 
      mentorId: new mongoose.Types.ObjectId(mentorId), 
      isActive: true 
    }).lean() as unknown as IMentorAvailability[]; 
  }

  async deleteMany(filter: mongoose.FilterQuery<IMentorAvailability>, session?: mongoose.ClientSession): Promise<unknown> {
    return await this.model.deleteMany(filter).session(session || null).exec();
  }

  async findOneAndUpdate(filter: mongoose.FilterQuery<IMentorAvailability>, update: mongoose.UpdateQuery<IMentorAvailability>, options?: mongoose.QueryOptions): Promise<IMentorAvailability | null> {
    return await this.model.findOneAndUpdate(filter, update, { ...options, new: true }).lean().exec() as unknown as IMentorAvailability | null;
  }
}
