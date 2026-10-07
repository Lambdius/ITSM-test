import { Module } from "@nestjs/common";

import { DatabaseModule } from "~infrastructure/database";

import { REPOSITORIES } from "./infrastructure/repositories";
import { DOMAIN_SERVICES } from "./domain/services";
import { RESOLVERS } from "./interface/resolvers";

@Module({
    imports: [DatabaseModule],
    providers: [...REPOSITORIES, ...DOMAIN_SERVICES, ...RESOLVERS],
})
export class ProfileModule {}
