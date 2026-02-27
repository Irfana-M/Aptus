import { injectable, inject } from "inversify";
import type { IExampleService } from "../interfaces/services/IExampleService";
import type { IExampleRepository } from "../interfaces/repositories/IExampleRepository";
import { TYPES } from "../types";

@injectable()
export class ExampleService implements IExampleService {
  constructor(
    @inject(TYPES.IExampleRepository) private _repository: IExampleRepository
  ) {}

  public async processData(): Promise<string[]> {
    const data = await this._repository.getData();
    return data.map(item => item.toUpperCase());
  }
}
