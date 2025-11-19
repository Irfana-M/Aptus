import "reflect-metadata";

export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  updateById(id: string, data: Partial<T>): Promise<T>;
  deleteById(id: string): Promise<boolean>;
  findAll(): Promise<T[]>;
  findOne(filter: Partial<T>): Promise<T | null>;
  count(filter?: Partial<T>): Promise<number>;
  block(id: string): Promise<T>; 
  unblock(id: string): Promise<T>;
  isBlocked(id: string): Promise<boolean>;
}