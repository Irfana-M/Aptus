export interface IBaseRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  updateById(id: string, data: Partial<T>): Promise<T>;
  deleteById(id: string): Promise<boolean>;
}
