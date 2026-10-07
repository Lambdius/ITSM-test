import { describe, expect, it } from "@jest/globals";

import { NodeEnv } from "~common/enums";
import { ErrorCode, Exception } from "~common/exceptions";

import { validateEnv } from "./env.validator";

const valid = {
    NODE_ENV: NodeEnv.DEVELOPMENT,
    APP_HOST: "127.0.0.1",
    APP_PORT: "3000",
    BODY_LIMIT_BYTES: "1048576",
    HSTS_MAX_AGE: "365d",
    ALLOWED_SERVICE_ORIGINS: "[]",
    ALLOWED_UI_ORIGINS: '["http://localhost:3000","http://127.0.0.1:3000","https://sandbox.embed.apollographql.com"]',

    DATABASE_URL: "postgresql://profile:profile@localhost:5432/profile",
};

describe("validateEnv", () => {
    it("converts the port explicitly and discards unrelated environment keys", () => {
        const config = validateEnv({ ...valid, UNRELATED: "value" });
        expect(config.APP_PORT).toBe(3000);
        expect(config).not.toHaveProperty("UNRELATED");
    });

    it.each(["0", "65536", "abc", "3.5", ""])("rejects invalid port %s", (APP_PORT) => {
        expect(() => validateEnv({ ...valid, APP_PORT })).toThrow(Exception);
    });

    it("requires all declared fields and validates the mode and database protocol", () => {
        expect(() => validateEnv({})).toThrow(Exception);
        expect(() => validateEnv({ ...valid, NODE_ENV: "unknown" })).toThrow(Exception);
        expect(() => validateEnv({ ...valid, DATABASE_URL: "https://example.com" })).toThrow(Exception);
    });

    it("does not include rejected credentials in the error message", () => {
        expect.assertions(4);
        try {
            validateEnv({ ...valid, DATABASE_URL: "secret-password" });
        } catch (error) {
            expect(error).toBeInstanceOf(Exception);
            expect(error).toMatchObject({ code: ErrorCode.BAD_REQUEST, statusCode: 400 });
            expect(error).toHaveProperty("details", [{ path: "DATABASE_URL", messages: [expect.any(String)] }]);
            expect(JSON.stringify(error)).not.toContain("secret-password");
        }
    });

    it.each(["not-json", "null", "{}", '["*"]', '["https://example.com/path"]', '["https://example.com/"]', "[42]"])(
        "rejects invalid origin list %s",
        (ALLOWED_UI_ORIGINS) => {
            expect(() => validateEnv({ ...valid, ALLOWED_UI_ORIGINS })).toThrow(Exception);
        },
    );

    it("requires valid security limits and durations", () => {
        expect(() => validateEnv({ ...valid, BODY_LIMIT_BYTES: "0" })).toThrow(Exception);
        expect(() => validateEnv({ ...valid, BODY_LIMIT_BYTES: "invalid" })).toThrow(Exception);
        expect(() => validateEnv({ ...valid, HSTS_MAX_AGE: "invalid" })).toThrow(Exception);
        expect(validateEnv({ ...valid, ALLOWED_UI_ORIGINS: "[]" }).ALLOWED_UI_ORIGINS).toBe("[]");
    });
});
