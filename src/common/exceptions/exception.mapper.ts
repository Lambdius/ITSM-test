import { GraphQLFormattedError } from "graphql";
import { HttpException } from "@nestjs/common";
import { isObject } from "class-validator";

import { Prisma } from "~infrastructure/database/generated/client";

import { Exception } from "./exception";
import { ErrorCode } from "./enums";

export class ExceptionMapper {
    public static fromGraphQL(error: GraphQLFormattedError): GraphQLFormattedError {
        const code = error.extensions?.code;
        const isGraphqlInputError = ["GRAPHQL_PARSE_FAILED", "GRAPHQL_VALIDATION_FAILED", "BAD_USER_INPUT"].includes(
            String(code),
        );
        const known = Object.values(ErrorCode).some((value) => value === code);
        return {
            message: isGraphqlInputError ? error.message : known ? error.message : "Internal server error",
            locations: error.locations,
            path: error.path,
            extensions: {
                code: isGraphqlInputError ? ErrorCode.BAD_REQUEST : known ? code : ErrorCode.INTERNAL,
                statusCode: isGraphqlInputError ? 400 : known ? error.extensions?.statusCode : 500,
                timestamp: error.extensions?.timestamp ?? new Date().toISOString(),
                ...(known && error.extensions?.details ? { details: error.extensions.details } : {}),
            },
        };
    }

    public static fromPrisma(error: unknown): Exception {
        if (error instanceof Exception) {
            return error;
        } else if (error instanceof Prisma.PrismaClientInitializationError) {
            return Exception.unavailable(error);
        } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
            switch (error.code) {
                case "P2039": {
                    const adapter = error.meta?.driverAdapterError;
                    if (
                        adapter instanceof Error &&
                        "cause" in adapter &&
                        adapter.cause !== null &&
                        isObject(adapter.cause) &&
                        "originalCode" in adapter.cause &&
                        adapter.cause.originalCode === "23514"
                    ) {
                        return Exception.conflict(error);
                    }
                    break;
                }
                case "P2025":
                    return Exception.notFound(error);
                case "P2034":
                case "P2002":
                case "P2003":
                case "P2004":
                    return Exception.conflict(error);
                case "P1001":
                case "P1002":
                case "P1017":
                case "P2024":
                case "P2037":
                    return Exception.unavailable(error);
            }
        }
        return Exception.internal(error);
    }

    public static fromUnknown(error: unknown): Exception {
        if (error instanceof Exception) {
            return error;
        } else if (error instanceof HttpException) {
            if (error.getStatus() === 413) {
                return Exception.payloadTooLarge(error);
            } else if (error.getStatus() === 503) {
                return Exception.unavailable(error);
            } else if (error.getStatus() === 404) {
                return Exception.notFound(error);
            } else if (error.getStatus() < 500) {
                const response = error.getResponse();
                const messages = typeof response === "string" ? [response] : (response as Exceptions.HttpResponse).message;
                return Exception.badRequest([
                    { path: "request", messages: Array.isArray(messages) ? messages : [messages ?? error.message] },
                ]);
            }
        }
        return Exception.internal(error);
    }
}
