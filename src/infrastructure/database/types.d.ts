import { QueryOrder } from "~infrastructure/database/enums";

import { Prisma } from "./generated/client";

declare global {
    namespace PrismaJson {
        type ProfessionalLinks = ValueObjects.ProfessionalLink.Data[];
    }

    namespace ORM {
        type Transaction = Prisma.TransactionClient;

        type EntityClass<T> = { prototype: T };
        type EntityData<T> = Pick<T, { [K in keyof T]: T[K] extends (...args: never[]) => unknown ? never : K }[keyof T]>;

        type OrdinalFilter<N extends boolean> = {
            equals?: N extends true ? Nullable<Date> : Date;
            not?: N extends true ? Nullable<Date> : Date;
            gte?: Date;
            lte?: Date;
            lt?: Date;
            gt?: Date;
        };

        namespace Utils.Pagination {
            type Value = string | Date;

            type Cursor = {
                values: string[];
                version: number;
                scope: string;
            };

            type Order<Field extends string = string> = {
                direction: QueryOrder;
                field: Field;
            };

            type Request<Filter, Order> = {
                orderBy?: Nullable<Order[]>;
                filter?: Nullable<Filter>;
                first?: Nullable<number>;
                after?: Nullable<string>;
            };

            type PageInfo = {
                startCursor: Nullable<string>;
                endCursor: Nullable<string>;
                hasPreviousPage: boolean;
                hasNextPage: boolean;
            };

            type Edge<Node> = {
                cursor: string;
                node: Node;
            };

            type Connection<Node> = {
                edges: Edge<Node>[];
                pageInfo: PageInfo;
            };

            type ConnectionProps<Row, Node> = {
                map(row: Row): Node;

                rows: Row[];
            };

            type Column<Field extends string = string> = {
                date?: boolean;
                direction: QueryOrder;
                field: Field;
            };

            type Condition = Record<
                string,
                {
                    equals?: string;
                    gt?: string;
                    lt?: string;
                }
            >;

            type Setup<Field extends string> = {
                first?: Nullable<number>;
                after?: Nullable<string>;
                order: Column<Field>[];
                resource: string;
                filter?: unknown;
            };
        }
    }
}
