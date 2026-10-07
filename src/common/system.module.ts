import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ExceptionMapper } from "~common/exceptions";
import { validateEnv } from "~common/validator";

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({ validate: validateEnv, envFilePath: ".env", isGlobal: true, cache: true }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
            includeStacktraceInErrorResponses: false,
            formatError: ExceptionMapper.fromGraphQL,
            fieldResolverEnhancers: ["filters"],
            driver: ApolloDriver,
            autoSchemaFile: true,
            introspection: true,
            playground: false,
            sortSchema: true,
        }),
    ],
    exports: [ConfigModule, GraphQLModule],
})
export class SystemModule {}
