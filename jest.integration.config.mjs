import common from "./configs/jest.base.config.mjs";

export default {
    ...common,
    globalTeardown: "<rootDir>/src/testing/integration/containers/postgres.teardown.ts",
    globalSetup: "<rootDir>/src/testing/integration/containers/setup.ts",
    testMatch: ["**/*.integration.spec.ts"],
    testTimeout: 120_000,
    maxWorkers: 1,
};
