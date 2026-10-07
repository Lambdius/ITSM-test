import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { ExceptionMapper } from "~common/exceptions/exception.mapper";
import { EnvironmentVariablesDTO } from "~common/dto";

import { PrismaClient } from "./generated/client";

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    public constructor(config: ConfigService<EnvironmentVariablesDTO, true>) {
        const connectionString = config.getOrThrow("DATABASE_URL", { infer: true });
        super({ adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 5000 }) });
    }

    public async transaction<T>(operation: (transaction: ORM.Transaction) => Promise<T>): Promise<T> {
        try {
            return await this.$transaction(operation, { isolationLevel: "Serializable" });
        } catch (error) {
            throw ExceptionMapper.fromPrisma(error);
        }
    }

    public async onModuleInit(): Promise<void> {
        await this.$connect();
    }

    public async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }
}
