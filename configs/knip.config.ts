import { KnipConfig } from "knip";

const config: KnipConfig = {
    ignoreExportsUsedInFile: true,
    project: ["src/**/*.ts", "src/**/*.prisma"],
    entry: ["src/**/*.spec.ts", "src/**/index.ts"],
    jest: { config: ["jest.*.config.mjs"] },
    ignoreDependencies: [
        "pino-pretty",
        "@types/ws",
    ],
};

export default config;
