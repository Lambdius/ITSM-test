import { Module } from "@nestjs/common";

import { LoggerModule } from "./logger";
import { HealthModule } from "./health";

@Module({
    imports: [LoggerModule, HealthModule],
    exports: [LoggerModule, HealthModule],
})
export class ObservabilityModule {}
