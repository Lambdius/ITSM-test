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

        type OperatorMap<T extends Nullable<Ordinal | string>> = {
            equals?: T;
            not?: T;
            in?: NonNullable<T>[];
            notIn?: NonNullable<T>[];
            gte?: NonNullable<T>;
            lte?: NonNullable<T>;
            lt?: NonNullable<T>;
            gt?: NonNullable<T>;
            contains?: T extends string ? string : never;
            mode?: Prisma.QueryMode;
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
