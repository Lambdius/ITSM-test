import { NestFastifyApplication } from "@nestjs/platform-fastify";

import { DatabaseService } from "~infrastructure/database";

declare global {
    namespace Integration.GraphQL {
        type Error = {
            message: string;
            extensions: {
                details?: Exceptions.ValidationDetail[];
                statusCode: number;
                code: string;
            };
        };

        type Mutation = Record<string, MessageResult>;

        type Lists = Record<string, ORM.Utils.Pagination.Connection<UnknownObject>>;

        type ProfileLists = {
            selected: Lists[string];
            profile: Lists;
        };

        type Result<Data = Record<string, Nullable<UnknownObject>>> = {
            errors?: Error[];
            data?: Data;
        };

        namespace Resource {
            interface Contract {
                application: NestFastifyApplication;
                query: Query.Signature;
                close: Close.Signature;
                url: string;
            }

            namespace Query {
                type Variables = Record<string, unknown>;

                type Signature = <Data = Record<string, Nullable<UnknownObject>>>(
                    document: string,
                    variables?: Variables,
                ) => Promise<Result<Data>>;
            }

            namespace Close {
                type Result = Promise<void>;

                type Signature = () => Result;
            }
        }

        namespace Suite {
            type Contract = {
                application(): Resource.Contract;
                prisma(): DatabaseService;
                profile(): string;
            };
        }
    }
}
