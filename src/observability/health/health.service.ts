import { HealthCheckService, HealthIndicatorStatus } from "@nestjs/terminus";
import { Injectable, Scope } from "@nestjs/common";

import { DatabaseHealthIndicator } from "~infrastructure/database/database.health";

@Injectable({ scope: Scope.DEFAULT })
export class HealthService {
    public constructor(
        private readonly database: DatabaseHealthIndicator,
        private readonly health: HealthCheckService,
    ) {}

    public liveness(): Health.Liveness {
        return { status: "ok" };
    }

    public async readiness(): Promise<Health.Readiness> {
        const result = await this.health.check([() => this.database.isHealthy("database")]);
        const components: Record<string, HealthIndicatorStatus> = {};

        for (const [key, value] of Object.entries(result.details)) {
            components[key] = value.status;
        }

        return { timestamp: new Date(), status: result.status, components };
    }
}
