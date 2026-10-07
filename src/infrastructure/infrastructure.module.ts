import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database";

@Module({
    imports: [DatabaseModule],
    exports: [DatabaseModule],
})
export class InfrastructureModule {}
