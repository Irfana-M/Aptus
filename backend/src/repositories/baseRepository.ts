import { AppError } from "@/utils/AppError";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "@/constants/httpStatus";
import type { IBaseRepository } from "@/interfaces/repositories/IBaseRepository";

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.model.findById(id).lean().exec();
    if (!result)
      throw new AppError(
        `${this.model.modelName} not found with ID:${id}`,
        HttpStatusCode.NOT_FOUND
      );
    return result;
  }

  async create(data: Partial<T>): Promise<T> {
    const result = await this.model.create(data);
    if (!result)
      throw new AppError(
        `Failed to create  ${this.model.model}`,
        HttpStatusCode.BAD_REQUEST
      );
    return result;
  }

  async updateById(id: string, data: Partial<T>): Promise<T> {
    const cleanData = this.removeUndefinedProperties(data);
    const result = await this.model
      .findByIdAndUpdate(id, cleanData, { new: true })
      .lean()
      .exec();
    if (!result)
      throw new AppError(
        `${this.model.modelName} update failed: ${id}`,
        HttpStatusCode.NOT_FOUND
      );
    return result as T;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = this.model.findByIdAndDelete(id);
    if (!result)
      throw new AppError(
        `${this.model.modelName} delete failed: ${id}`,
        HttpStatusCode.NOT_FOUND
      );
    return result;
  }
  protected removeUndefinedProperties<T extends object>(
    obj: Partial<T>
  ): Partial<T> {
    const cleanObj: Partial<T> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        (cleanObj as any)[key] = value;
      }
    }

    return cleanObj;
  }
}
