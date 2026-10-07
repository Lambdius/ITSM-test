import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execFileSync } from "node:child_process";
import { ConfigService } from "@nestjs/config";

import { DatabaseService } from "~infrastructure/database/database.service";
import { EnvironmentVariablesDTO } from "~common/dto";
import { Exception } from "~common/exceptions/exception";

import { CONNECTION_ENV_KEY, POSTGRES_IMAGE, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD } from "./postgres.constants";

let container: Optional<StartedPostgreSqlContainer>;

export class PostgresResource implements Integration.Postgres.Resource.Contract {
    private constructor(public readonly prisma: DatabaseService) {}

    public static async start(): Promise<PostgresResource> {
        container = await new PostgreSqlContainer(POSTGRES_IMAGE)
            .withDatabase(DATABASE_NAME)
            .withUsername(DATABASE_USER)
            .withPassword(DATABASE_PASSWORD)
            .start();
        try {
            process.env[CONNECTION_ENV_KEY] = container.getConnectionUri();
            process.env.DATABASE_URL = container.getConnectionUri();
            execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
                env: process.env,
                stdio: "pipe",
                timeout: 60_000,
            });
            return await PostgresResource.connect();
        } catch (error) {
            await PostgresResource.stop();
            throw error;
        }
    }

    public static async connect(): Promise<PostgresResource> {
        const prisma = new DatabaseService(PostgresResource.config());
        try {
            await prisma.$connect();
            return new PostgresResource(prisma);
        } catch (error) {
            await prisma.$disconnect();
            throw error;
        }
    }

    public static config(): ConfigService<EnvironmentVariablesDTO, true> {
        const connection = process.env[CONNECTION_ENV_KEY];
        if (!connection || connection !== process.env.DATABASE_URL) {
            throw Exception.internal({
                resource: "Integration database",
                reason: "Jest globalSetup has not initialized it",
            });
        }
        return new ConfigService<EnvironmentVariablesDTO, true>({ DATABASE_URL: connection });
    }

    public async reset(): Integration.Postgres.Resource.Reset.Result {
        await this.prisma.$transaction([
            this.prisma.profileSkill.deleteMany(),
            this.prisma.experience.deleteMany(),
            this.prisma.project.deleteMany(),
            this.prisma.profile.deleteMany(),
        ]);
    }

    public async close(): Integration.Postgres.Resource.Close.Result {
        await this.prisma.$disconnect();
    }

    public static async stop(): Integration.Postgres.Resource.Close.Result {
        if (container) {
            await container.stop();
            container = undefined;
        }
    }
}
