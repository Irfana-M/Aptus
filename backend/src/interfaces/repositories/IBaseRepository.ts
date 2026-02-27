import "reflect-metadata";
import type { ClientSession } from "mongoose";

export interface IBaseRepository<T> {
  findById(id: string, session?: ClientSession): Promise<T | null>;
  create(data: Partial<T>, session?: ClientSession): Promise<T>;
  updateById(id: string, data: Partial<T>, session?: ClientSession): Promise<T>;
  deleteById(id: string, session?: ClientSession): Promise<boolean>;
  findAll(): Promise<T[]>;
  find(filter: Record<string, unknown>, session?: ClientSession): Promise<T[]>;
  findOne(filter: Record<string, unknown>, session?: ClientSession): Promise<T | null>;
  count(filter?: Record<string, unknown>, session?: ClientSession): Promise<number>;
  block(id: string): Promise<T>; 
  unblock(id: string): Promise<T>;
  isBlocked(id: string): Promise<boolean>;
  findPaginated(
    filter: Record<string, unknown>, 
    page: number, 
    limit: number, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sort?: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    populate?: string[] | any
  ): Promise<{ items: T[], total: number }>;
}