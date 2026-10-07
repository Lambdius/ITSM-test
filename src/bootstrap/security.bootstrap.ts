import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import { FastifyReply } from "fastify";
import ms from "ms";

import { EnvironmentVariablesDTO } from "~common/dto";
import { Exception } from "~common/exceptions";
import { NodeEnv } from "~common/enums";

export abstract class BootstrapSecurity {
    private constructor() {}

    public static async registerSecurityPlugins(application: NestFastifyApplication): Promise<void> {
        const config = application.get(ConfigService<EnvironmentVariablesDTO, true>);
        this.enforceAllowedOrigins(application, config);
        await this.configureCrossOriginResourceSharing(application);
        await this.configureSecurityHeaders(application, config);
        this.removeServerHeader(application);
        this.blockUnsafeHttpMethods(application);
    }

    private static enforceAllowedOrigins(
        application: NestFastifyApplication,
        config: ConfigService<EnvironmentVariablesDTO, true>,
    ): void {
        const serviceOrigins = JSON.parse(config.getOrThrow("ALLOWED_SERVICE_ORIGINS", { infer: true })) as string[];
        const uiOrigins = JSON.parse(config.getOrThrow("ALLOWED_UI_ORIGINS", { infer: true })) as string[];
        const allowedOrigins = serviceOrigins.concat(uiOrigins);
        application
            .getHttpAdapter()
            .getInstance()
            .addHook("onRequest", (request, reply, done) => {
                const origin = request.headers.origin;
                if (origin && !allowedOrigins.includes(origin)) {
                    this.sendException(reply, Exception.forbidden("CORS origin is not allowed"));
                } else {
                    done();
                }
            });
    }

    private static async configureCrossOriginResourceSharing(application: NestFastifyApplication): Promise<void> {
        await application.register(fastifyCors, {
            origin: (_origin, callback) => callback(null, true),
            methods: ["GET", "POST", "OPTIONS"],
            allowedHeaders: ["Authorization", "Content-Type", "Apollo-Require-Preflight", "X-Apollo-Operation-Name"],
            credentials: true,
            maxAge: 86400,
        });
    }

    private static async configureSecurityHeaders(
        application: NestFastifyApplication,
        config: ConfigService<EnvironmentVariablesDTO, true>,
    ): Promise<void> {
        const hstsMaxAge = config.getOrThrow<EnvironmentVariablesDTO["HSTS_MAX_AGE"]>("HSTS_MAX_AGE");
        const isProduction = config.getOrThrow("NODE_ENV", { infer: true }) === NodeEnv.PRODUCTION;
        await application.register(fastifyHelmet, {
            crossOriginEmbedderPolicy: true,
            crossOriginOpenerPolicy: { policy: "same-origin" },
            crossOriginResourcePolicy: { policy: "same-origin" },
            contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
            hsts: isProduction
                ? {
                      maxAge: ms(hstsMaxAge) / 1e3,
                      includeSubDomains: true,
                      preload: true,
                  }
                : false,
            noSniff: true,
        });
        application
            .getHttpAdapter()
            .getInstance()
            .addHook("onSend", (request, reply, payload, done) => {
                const contentType = reply.getHeader("content-type");
                if (
                    request.url.split("?")[0] === "/graphql" &&
                    typeof contentType === "string" &&
                    contentType.includes("text/html")
                ) {
                    reply.header("content-security-policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
                    reply.raw.removeHeader("cross-origin-embedder-policy");
                }
                done(null, payload);
            });
    }

    private static removeServerHeader(application: NestFastifyApplication): void {
        application
            .getHttpAdapter()
            .getInstance()
            .addHook("onSend", (_request, reply, payload, done) => {
                reply.removeHeader("x-powered-by");
                reply.removeHeader("server");
                reply.raw.removeHeader("x-powered-by");
                reply.raw.removeHeader("server");
                done(null, payload);
            });
    }

    private static blockUnsafeHttpMethods(application: NestFastifyApplication): void {
        application
            .getHttpAdapter()
            .getInstance()
            .addHook("onRequest", (request, reply, done) => {
                if (request.method === "TRACE" || request.method === "TRACK") {
                    this.sendException(reply, Exception.methodNotAllowed(`HTTP method is not allowed: ${request.method}`));
                } else {
                    done();
                }
            });
    }

    private static sendException(reply: FastifyReply, exception: Exception): void {
        reply.code(exception.statusCode).type("application/json; charset=utf-8").send({
            statusCode: exception.statusCode,
            timestamp: exception.timestamp,
            message: exception.message,
            code: exception.code,
        });
    }
}
