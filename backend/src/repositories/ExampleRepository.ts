import { injectable } from "inversify";
import type { IExampleRepository } from "../interfaces/repositories/IExampleRepository.js";

@injectable()
export class ExampleRepository implements IExampleRepository {
  public async getData(): Promise<string[]> {
    return ["Example Data 1", "Example Data 2"];
  }
}
