export default {
    testEnvironment: "node",
    moduleFileExtensions: ["ts", "js", "json"],
    extensionsToTreatAsEsm: [".ts"],
    bail: true,
    clearMocks: true,
    verbose: true,
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: { module: "ES2022", moduleResolution: "Bundler", sourceMap: true, inlineSources: true },
                useESM: true,
            },
        ],
    },
    roots: ["<rootDir>/src"],
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/**/*.d.ts",
        "!src/**/{main,seed,index,constants,enums,tokens}.ts",
        "!src/**/*.{module,dto,spec,types}.ts",
        "!src/infrastructure/database/generated/**",
        "!src/infrastructure/database/datasets/**",
        "!src/testing/**",
    ],
    moduleNameMapper: {
        "^~(infrastructure|context|common|testing|bootstrap|observability)$": "<rootDir>/src/$1/index.ts",
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "^~infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
        "^~root/(.*)$": "<rootDir>/$1",
        "^~observability/(.*)$": "<rootDir>/src/observability/$1",
        "^~context/(.*)$": "<rootDir>/src/context/$1",
        "^~common/(.*)$": "<rootDir>/src/common/$1",
        "^~bootstrap/(.*)$": "<rootDir>/src/bootstrap/$1",
        "^~testing/(.*)$": "<rootDir>/src/testing/$1",
    },
    setupFiles: ["reflect-metadata"],
};
