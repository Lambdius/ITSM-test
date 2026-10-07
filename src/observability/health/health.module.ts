import { TerminusModule } from "@nestjs/terminus";
import { Module } from "@nestjs/common";

import { DatabaseHealthIndicator } from "~infrastructure/database/database.health";
import { DatabaseModule } from "~infrastructure/database";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
    imports: [TerminusModule, DatabaseModule],
    controllers: [HealthController],
    providers: [DatabaseHealthIndicator, HealthService],
})
export class HealthModule {}
