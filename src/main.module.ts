import { APP_FILTER } from "@nestjs/core";
import { Module } from "@nestjs/common";

import { InfrastructureModule } from "~infrastructure";
import { ExceptionFilter } from "~common/exceptions";
import { ObservabilityModule } from "~observability";
import { SystemModule } from "~common/system.module";
import { ProfileModule } from "~context";

@Module({
    imports: [SystemModule, InfrastructureModule, ObservabilityModule, ProfileModule],
    providers: [{ provide: APP_FILTER, useClass: ExceptionFilter }],
})
export class MainModule {}
