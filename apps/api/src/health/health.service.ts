import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service";

type HealthResponse = {
  status: "ok" | "error";
  service: "api";
  healthCheckValue: string | null;
  database: {
    status: "up" | "down";
  };
};

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getHealth(): Promise<HealthResponse> {
    const databaseUp = await this.databaseService.checkConnection();
    const healthCheckValue = databaseUp
      ? await this.databaseService.getHealthCheckValue()
      : null;

    return {
      status: databaseUp ? "ok" : "error",
      service: "api",
      healthCheckValue,
      database: {
        status: databaseUp ? "up" : "down"
      }
    };
  }
}
