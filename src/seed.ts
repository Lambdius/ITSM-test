import { PrismaPg } from "@prisma/adapter-pg";
import pino from "pino";
import "dotenv/config";

import { PrismaClient } from "~infrastructure/database/generated/client";
import { seed } from "~infrastructure/database/seeder";
import { Exception } from "~common/exceptions";

async function bootstrap(): Promise<void> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw Exception.badRequest([{ path: "DATABASE_URL", messages: ["DATABASE_URL is required"] }]);
    }
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    try {
        await seed(prisma);
        pino().info({ context: "Seed" }, "Database seeded");
    } finally {
        await prisma.$disconnect();
    }
}

bootstrap().catch((error: unknown) => {
    pino().error({ err: error, context: "Seed" }, "Database seed failed");
    process.exitCode = 1;
});
