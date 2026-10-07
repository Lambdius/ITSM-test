import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
    schema: "src",
    migrations: {
        path: "src/infrastructure/database/migrations",
        seed: "pnpm exec tsx src/seed.ts",
    },
    datasource: {
        url: process.env.DATABASE_URL
    },
});
