import { ErrorCode } from "./enums";

export class Exception extends Error {
    public readonly timestamp = new Date().toISOString();
    public readonly statusCode: number;
    public readonly code: ErrorCode;

    public readonly details?: Exceptions.ValidationDetail[];
    public readonly cause?: unknown;

    public constructor(
        code: ErrorCode,
        statusCode: number,
        message: string,
        details?: Exceptions.ValidationDetail[],
        cause?: unknown,
    ) {
        super(message);
        this.name = "Exception";
        this.statusCode = statusCode;
        this.details = details;
        this.cause = cause;
        this.code = code;
    }

    public static badRequest(details: Exceptions.ValidationDetail[], message = "Invalid request"): Exception {
        return new Exception(ErrorCode.BAD_REQUEST, 400, message, details);
    }

    public static invariantViolation(props: Exceptions.InvariantViolationProps): Exception {
        return new Exception(ErrorCode.INVARIANT_VIOLATION, 422, props.message);
    }

    public static payloadTooLarge(cause?: unknown): Exception {
        return new Exception(ErrorCode.PAYLOAD_TOO_LARGE, 413, "Request body is too large", undefined, cause);
    }

    public static forbidden(message: string): Exception {
        return new Exception(ErrorCode.FORBIDDEN, 403, message);
    }

    public static methodNotAllowed(message: string): Exception {
        return new Exception(ErrorCode.METHOD_NOT_ALLOWED, 405, message);
    }

    public static notFound(cause?: unknown, message = "Resource not found"): Exception {
        return new Exception(ErrorCode.NOT_FOUND, 404, message, undefined, cause);
    }

    public static conflict(cause?: unknown): Exception {
        return new Exception(ErrorCode.CONFLICT, 409, "Data constraint violation", undefined, cause);
    }

    public static unavailable(cause?: unknown): Exception {
        return new Exception(ErrorCode.DATABASE_UNAVAILABLE, 503, "Database temporarily unavailable", undefined, cause);
    }

    public static internal(cause?: unknown): Exception {
        return new Exception(ErrorCode.INTERNAL, 500, "Internal server error", undefined, cause);
    }
}
