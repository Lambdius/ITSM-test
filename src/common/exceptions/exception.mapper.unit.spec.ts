import { describe, expect, it } from "@jest/globals";
import { BadRequestException, PayloadTooLargeException } from "@nestjs/common";

import { Prisma } from "~infrastructure/database/generated/client";

import { ExceptionMapper } from "./exception.mapper";
import { Exception } from "./exception";
import { ErrorCode } from "./enums";

describe("ExceptionMapper", () => {
    it.each([
        ["P2002", ErrorCode.CONFLICT, 409],
        ["P2003", ErrorCode.CONFLICT, 409],
        ["P2034", ErrorCode.CONFLICT, 409],
        ["P2025", ErrorCode.NOT_FOUND, 404],
        ["P2024", ErrorCode.DATABASE_UNAVAILABLE, 503],
        ["P9999", ErrorCode.INTERNAL, 500],
    ])("maps Prisma %s without exposing the original message", (code, expected, statusCode) => {
        const original = new Prisma.PrismaClientKnownRequestError("SQL and private data", {
            code: String(code),
            clientVersion: "7.10.0",
        });
        const mapped = ExceptionMapper.fromPrisma(original);
        expect(mapped).toMatchObject({ code: expected, statusCode, cause: original });
        expect(mapped.message).not.toContain("private data");
    });

    it("preserves application exceptions and masks unknown failures", () => {
        const known = Exception.badRequest([{ path: "name", messages: ["Required"] }]);
        expect(ExceptionMapper.fromPrisma(known)).toBe(known);
        expect(ExceptionMapper.fromUnknown(known)).toBe(known);
        expect(ExceptionMapper.fromUnknown(new Error("secret"))).toMatchObject({
            code: ErrorCode.INTERNAL,
            message: "Internal server error",
        });
    });

    it("normalizes GraphQL input errors", () => {
        for (const code of ["GRAPHQL_PARSE_FAILED", "GRAPHQL_VALIDATION_FAILED", "BAD_USER_INPUT"]) {
            expect(ExceptionMapper.fromGraphQL({ message: "Invalid argument", extensions: { code } })).toMatchObject({
                message: "Invalid argument",
                extensions: { code: ErrorCode.BAD_REQUEST, statusCode: 400 },
            });
        }
    });

    it("preserves application details and GraphQL error location", () => {
        const error = {
            message: "Invalid request",
            path: ["profiles"],
            locations: [{ line: 1, column: 3 }],
            extensions: {
                code: ErrorCode.BAD_REQUEST,
                statusCode: 400,
                timestamp: "2026-01-01T00:00:00.000Z",
                details: [{ path: "filter.name", messages: ["Required"] }],
            },
        };
        expect(ExceptionMapper.fromGraphQL(error)).toEqual(error);
    });

    it("masks unknown GraphQL errors and strips their extensions", () => {
        expect(
            ExceptionMapper.fromGraphQL({
                message: "private SQL",
                extensions: { code: "UNKNOWN", stacktrace: ["secret"], details: ["private"] },
            }),
        ).toEqual({
            message: "Internal server error",
            extensions: { code: ErrorCode.INTERNAL, statusCode: 500, timestamp: expect.any(String) },
        });
    });
    it("preserves framework validation reasons", () => {
        const mapped = ExceptionMapper.fromUnknown(new BadRequestException("Validation failed (uuid is expected)"));
        expect(mapped.details).toEqual([{ path: "request", messages: ["Validation failed (uuid is expected)"] }]);
    });

    it.each([
        ["23514", ErrorCode.CONFLICT],
        ["XX000", ErrorCode.INTERNAL],
    ])("maps adapter PostgreSQL %s without exposing SQL", (code, expected) => {
        const original = new Prisma.PrismaClientKnownRequestError("SQL and private data", {
            code: "P2039",
            clientVersion: "7.10.0",
            meta: { driverAdapterError: Object.assign(new Error("private SQL"), { cause: { originalCode: code } }) },
        });
        expect(ExceptionMapper.fromPrisma(original)).toMatchObject({ code: expected, cause: original });
    });

    it("preserves HTTP 413 for an oversized request body", () => {
        expect(ExceptionMapper.fromUnknown(new PayloadTooLargeException())).toMatchObject({
            code: ErrorCode.PAYLOAD_TOO_LARGE,
            statusCode: 413,
            message: "Request body is too large",
        });
    });
});
