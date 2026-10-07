import { GqlContextType, GqlExceptionFilter } from "@nestjs/graphql";
import { ArgumentsHost, Catch, Logger } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { GraphQLError } from "graphql";

import { ExceptionMapper } from "./exception.mapper";

@Catch()
export class ExceptionFilter implements GqlExceptionFilter {
    private readonly logger = new Logger(ExceptionFilter.name);

    public constructor(private readonly adapterHost: HttpAdapterHost) {}

    public catch(error: unknown, host: ArgumentsHost): Optional<GraphQLError> {
        const exception = ExceptionMapper.fromUnknown(error);

        if (exception.statusCode >= 500) {
            this.logger.error(exception.cause instanceof Error ? exception.cause.stack : exception.message);
        }

        const extensions = {
            statusCode: exception.statusCode,
            timestamp: exception.timestamp,
            code: exception.code,
            ...(exception.details ? { details: exception.details } : {}),
        };

        if (host.getType<GqlContextType>() === "graphql") {
            return new GraphQLError(exception.message, { extensions });
        } else {
            const response = host.switchToHttp().getResponse<unknown>();
            this.adapterHost.httpAdapter.reply(
                response,
                { message: exception.message, ...extensions },
                exception.statusCode,
            );
            return undefined;
        }
    }
}
