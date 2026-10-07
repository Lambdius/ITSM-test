import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { BootstrapPipes, BootstrapSecurity } from "~bootstrap";
import { MainModule } from "~root/src/main.module";

export class GraphQLResource implements Integration.GraphQL.Resource.Contract {
    private constructor(
        public readonly application: NestFastifyApplication,
        public readonly url: string,
    ) {}

    public static async connect(): Promise<GraphQLResource> {
        const app = await NestFactory.create<NestFastifyApplication>(
            MainModule,
            new FastifyAdapter({ bodyLimit: Number(process.env.BODY_LIMIT_BYTES) }),
            {
                abortOnError: false,
                bufferLogs: true,
            },
        );
        try {
            app.useLogger(app.get(Logger));
            BootstrapPipes.applyGlobalPipes(app);
            await BootstrapSecurity.registerSecurityPlugins(app);
            await app.listen(0, "127.0.0.1");
            return new GraphQLResource(app, await app.getUrl());
        } catch (error) {
            await app.close();
            throw error;
        }
    }

    public async query<Data = Record<string, Nullable<UnknownObject>>>(
        document: string,
        variables: Integration.GraphQL.Resource.Query.Variables = {},
    ): Promise<Integration.GraphQL.Result<Data>> {
        const response = await fetch(`${this.url}/graphql`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ query: document, variables }),
        });
        return (await response.json()) as Integration.GraphQL.Result<Data>;
    }

    public async close(): Integration.GraphQL.Resource.Close.Result {
        await this.application.close();
    }
}
