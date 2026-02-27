import type { Request, Response } from "express";
import { injectable, inject } from "inversify";
import type { IExampleService } from "../interfaces/services/IExampleService";
import { TYPES } from "../types";
import { HttpStatusCode } from "../constants/httpStatus";

@injectable()
export class ExampleController {
  constructor(
    @inject(TYPES.IExampleService) private _service: IExampleService
  ) {}

  public getExampleData = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this._service.processData();
      res.status(HttpStatusCode.OK).json({ success: true, data });
    } catch (_error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: "Failed to fetch example data" 
      });
    }
  };
}
