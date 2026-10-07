import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import pino from "pino";
import "reflect-metadata";

import { BootstrapPipes, BootstrapSecurity } from "~bootstrap";

import { MainModule } from "./main.module";

async function bootstrap(): Promise<void> {
    const fastifyAdapter = new FastifyAdapter({
        bodyLimit: Number(process.env.BODY_LIMIT_BYTES),
        logger: false,
    });

    const application = await NestFactory.create<NestFastifyApplication>(MainModule, fastifyAdapter, { bufferLogs: true });

    application.useLogger(application.get(Logger));
    const configService = application.get(ConfigService);

    BootstrapPipes.applyGlobalPipes(application);
    await BootstrapSecurity.registerSecurityPlugins(application);

    application.enableShutdownHooks();

    const port: number = configService.getOrThrow<number>("APP_PORT");
    const host: string = configService.getOrThrow<string>("APP_HOST");

    await application.listen({ port, host });
}

bootstrap().catch((error: unknown) => {
    pino().error({ err: error, context: "Bootstrap" }, "Application startup failed");
    process.exitCode = 1;
});
