import { injectable, inject } from "inversify";
import type { IExampleService } from "../interfaces/services/IExampleService.js";
import type { IExampleRepository } from "../interfaces/repositories/IExampleRepository.js";
import { TYPES } from "../types.js";

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
