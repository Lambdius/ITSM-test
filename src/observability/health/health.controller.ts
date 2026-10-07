import { Controller, Get } from "@nestjs/common";
import { HealthCheck } from "@nestjs/terminus";

import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
    public constructor(private readonly healthService: HealthService) {}

    @HealthCheck()
    @Get("liveness")
    public liveness(): Health.Liveness {
        return this.healthService.liveness();
    }

    @HealthCheck()
    @Get("readiness")
    public readiness(): Promise<Health.Readiness> {
        return this.healthService.readiness();
    }
}
