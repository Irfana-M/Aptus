import "reflect-metadata";
import type { ClientSession } from "mongoose";

export interface IBaseRepository<T> {
  findById(id: string, session?: ClientSession): Promise<T | null>;
  create(data: Partial<T>, session?: ClientSession): Promise<T>;
  updateById(id: string, data: Partial<T>, session?: ClientSession): Promise<T>;
  deleteById(id: string, session?: ClientSession): Promise<boolean>;
  findAll(): Promise<T[]>;
  findOne(filter: any, session?: ClientSession): Promise<T | null>;
  count(filter?: any, session?: ClientSession): Promise<number>;
  block(id: string): Promise<T>; 
  unblock(id: string): Promise<T>;
  isBlocked(id: string): Promise<boolean>;
}