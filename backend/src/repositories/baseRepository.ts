// baseRepository.ts
import { AppError } from "@/utils/AppError";
import { logger } from "@/utils/logger";
import { HttpStatusCode } from "@/constants/httpStatus";
import type { IBaseRepository } from "@/interfaces/repositories/IBaseRepository";
import { injectable } from "inversify";

@injectable()
export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    try {
      logger.debug(`Finding ${this.model.modelName} by ID: ${id}`);
      const result = await this.model.findById(id).lean().exec();
      
      if (!result) {
        logger.warn(`${this.model.modelName} not found with ID: ${id}`);
        throw new AppError(
          `${this.model.modelName} not found with ID: ${id}`,
          HttpStatusCode.NOT_FOUND
        );
      }
      
      logger.info(`${this.model.modelName} found by ID: ${id}`);
      return result;
    } catch (error) {
      logger.error(`Error finding ${this.model.modelName} by ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to find ${this.model.modelName}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      logger.debug(`Creating new ${this.model.modelName}`, { email: (data as any).email });
      const result = await this.model.create(data);
      
      if (!result) {
        logger.error(`Failed to create ${this.model.modelName}`);
        throw new AppError(
          `Failed to create ${this.model.modelName}`,
          HttpStatusCode.BAD_REQUEST
        );
      }
      
      logger.info(`${this.model.modelName} created successfully: ${result._id}`);
      return result;
    } catch (error) {
      logger.error(`Error creating ${this.model.modelName}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to create ${this.model.modelName}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateById(id: string, data: Partial<T>): Promise<T> {
    try {
      logger.debug(`Updating ${this.model.modelName} with ID: ${id}`);
      const cleanData = this.removeUndefinedProperties(data);
      
      const result = await this.model
        .findByIdAndUpdate(id, cleanData, { new: true, runValidators: true })
        .lean()
        .exec();
      
      if (!result) {
        logger.warn(`${this.model.modelName} update failed - ID not found: ${id}`);
        throw new AppError(
          `${this.model.modelName} update failed: ${id}`,
          HttpStatusCode.NOT_FOUND
        );
      }
      
      logger.info(`${this.model.modelName} updated successfully: ${id}`);
      return result as T;
    } catch (error) {
      logger.error(`Error updating ${this.model.modelName} with ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to update ${this.model.modelName}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      logger.debug(`Deleting ${this.model.modelName} with ID: ${id}`);
      const result = await this.model.findByIdAndDelete(id).exec();
      
      if (!result) {
        logger.warn(`${this.model.modelName} delete failed - ID not found: ${id}`);
        throw new AppError(
          `${this.model.modelName} delete failed: ${id}`,
          HttpStatusCode.NOT_FOUND
        );
      }
      
      logger.info(`${this.model.modelName} deleted successfully: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting ${this.model.modelName} with ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to delete ${this.model.modelName}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findAll(): Promise<T[]> {
    try {
      logger.debug(`Finding all ${this.model.modelName} records`);
      const results = await this.model.find({}).lean().exec();
      logger.info(`Found ${results.length} ${this.model.modelName} records`);
      return results;
    } catch (error) {
      logger.error(`Error finding all ${this.model.modelName} records:`, error);
      throw new AppError(
        `Failed to retrieve ${this.model.modelName} records`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    try {
      logger.debug(`Finding one ${this.model.modelName} with filter:`, filter);
      const result = await this.model.findOne(filter).lean().exec();
      
      if (result) {
        logger.info(`${this.model.modelName} found with filter`);
      } else {
        logger.debug(`${this.model.modelName} not found with filter`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error finding ${this.model.modelName} with filter:`, error);
      throw new AppError(
        `Failed to find ${this.model.modelName}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async count(filter?: Partial<T>): Promise<number> {
    try {
      logger.debug(`Counting ${this.model.modelName} records with filter:`, filter);
      const count = await this.model.countDocuments(filter || {}).exec();
      logger.debug(`Count result for ${this.model.modelName}: ${count}`);
      return count;
    } catch (error) {
      logger.error(`Error counting ${this.model.modelName} records:`, error);
      throw new AppError(
        `Failed to count ${this.model.modelName} records`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }


async block(id: string): Promise<T> {
  try {
    logger.debug(`Blocking ${this.model.modelName} with ID: ${id}`);
    const result = await this.model
      .findByIdAndUpdate(
        id, 
        { 
          isBlocked: true, 
          blockedAt: new Date() 
        }, 
        { new: true }
      )
      .lean()
      .exec();
    
    if (!result) {
      logger.warn(`${this.model.modelName} block failed - ID not found: ${id}`);
      throw new AppError(
        `${this.model.modelName} block failed: ${id}`,
        HttpStatusCode.NOT_FOUND
      );
    }
    
    logger.info(`${this.model.modelName} blocked successfully: ${id}`);
    return result; 
  } catch (error) {
    logger.error(`Error blocking ${this.model.modelName} with ID ${id}:`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Failed to block ${this.model.modelName}`,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

async unblock(id: string): Promise<T> {
  try {
    logger.debug(`Unblocking ${this.model.modelName} with ID: ${id}`);
    const result = await this.model
      .findByIdAndUpdate(
        id, 
        { 
          isBlocked: false, 
          blockedAt: null 
        }, 
        { new: true }
      )
      .lean()
      .exec();
    
    if (!result) {
      logger.warn(`${this.model.modelName} unblock failed - ID not found: ${id}`);
      throw new AppError(
        `${this.model.modelName} unblock failed: ${id}`,
        HttpStatusCode.NOT_FOUND
      );
    }
    
    logger.info(`${this.model.modelName} unblocked successfully: ${id}`);
    return result; 
  } catch (error) {
    logger.error(`Error unblocking ${this.model.modelName} with ID ${id}:`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Failed to unblock ${this.model.modelName}`,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}


  async isBlocked(id: string): Promise<boolean> {
    try {
      logger.debug(`Checking if ${this.model.modelName} is blocked: ${id}`);
      const user = await this.model.findById(id).select('isBlocked').lean().exec();
      
      if (!user) {
        logger.warn(`${this.model.modelName} not found for blocked check: ${id}`);
        throw new AppError(
          `${this.model.modelName} not found: ${id}`,
          HttpStatusCode.NOT_FOUND
        );
      }
      
      const isBlocked = !!user.isBlocked;
      logger.debug(`${this.model.modelName} blocked status: ${isBlocked} for ID: ${id}`);
      return isBlocked;
    } catch (error) {
      logger.error(`Error checking blocked status for ${this.model.modelName} with ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to check blocked status`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
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