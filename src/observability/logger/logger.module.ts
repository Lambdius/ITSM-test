import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TransportTargetOptions } from "pino";
import { createRequire } from "node:module";
import { Module } from "@nestjs/common";

import { NodeEnv } from "~common/enums";

@Module({
    imports: [
        PinoLoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const nodeEnv = configService.getOrThrow<NodeEnv>("NODE_ENV");
                const targets: TransportTargetOptions[] = [];
                const isDevelopment = nodeEnv === NodeEnv.DEVELOPMENT;
                const level = isDevelopment ? "info" : "warn";

                if (isDevelopment) {
                    targets.push({
                        options: {
                            translateTime: "UTC:yyyy-mm-dd HH:MM:ss",
                            singleLine: true,
                            colorize: true,
                        },
                        target: createRequire(`${process.cwd()}/package.json`).resolve("pino-pretty"),
                        level,
                    });
                }

                return {
                    pinoHttp: {
                        redact: ["req.headers.authorization", "req.headers.cookie", "body.password"],
                        transport: targets.length > 0 ? { targets } : undefined,
                        quietReqLogger: true,
                        autoLogging: false,
                        level,
                    },
                };
            },
        }),
    ],
    exports: [PinoLoggerModule],
})
export class LoggerModule {}
