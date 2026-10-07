import { HealthIndicatorService, HealthIndicatorResult } from "@nestjs/terminus";
import { Injectable } from "@nestjs/common";

import { DatabaseService } from "./database.service";

@Injectable()
export class DatabaseHealthIndicator {
    public constructor(
        private readonly prisma: DatabaseService,
        private readonly healthIndicatorService: HealthIndicatorService,
    ) {}

    public async isHealthy<T extends string>(key: T): Promise<HealthIndicatorResult<T>> {
        const indicator = this.healthIndicatorService.check(key);
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return indicator.up();
        } catch {
            return indicator.down({ message: "connection_lost" });
        }
    }
}
