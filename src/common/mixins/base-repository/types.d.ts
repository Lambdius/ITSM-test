import { Prisma } from "~infrastructure/database/generated/client";
import { QueryOrder } from "~infrastructure/database/enums";

declare global {
    namespace Repositories.Base {
        type Resource = Uncapitalize<Prisma.ModelName>;

        type Client<E, A extends Repositories.Mappers.Meta, R extends Resource> = Record<R, Model<E, A>>;

        type Row<E, A extends Repositories.Mappers.Meta> = ORM.EntityData<E> & { id: string } & Record<
                A["Sort"][number]["field"],
                ORM.Utils.Pagination.Value
            >;

        type Model<E, A extends Repositories.Mappers.Meta> = {
            findUnique(props: {
                where: { id: string };
                include?: Record<string, object>;
                relationLoadStrategy?: "join";
            }): Promise<Nullable<Row<E, A>>>;
            findMany(props: {
                where: A["Where"] | { AND: [A["Where"], { OR?: ORM.Utils.Pagination.Condition[] }] };
                orderBy: Record<string, QueryOrder>[];
                take?: number;
                include?: Record<string, object>;
                relationLoadStrategy?: "join";
            }): Promise<Row<E, A>[]>;
        };

        namespace Mixin {
            type Props<E, A extends Repositories.Mappers.Meta> = {
                Mapper: new () => Repositories.Mappers.Contract<A["Where"], A>;
                Entity: ORM.EntityClass<E>;
                populate?(props: A["Populate"]): Repositories.Population.Plan<E>;
            };

            type Result<E, A extends Repositories.Mappers.Meta, R extends Resource> = new (
                client: Client<E, A, R>,
            ) => Contract<E, A, R> & Repositories.Mappers.Contract<A["Where"], A>;
        }

        interface Contract<E, A extends Repositories.Mappers.Meta, R extends Resource> {
            readonly resource: R;
            findMany(props: FindMany<A>): Promise<ORM.Utils.Pagination.Connection<E>>;
            findById(props: FindById<Client<E, A, R>, A["Populate"]>): Promise<Nullable<E>>;
            find(props: Find<A["Where"], Client<E, A, R>, A["Populate"]>): Promise<E[]>;
        }

        type FindById<Transaction = ORM.Transaction, Populate = never> = {
            transaction?: Transaction;
            populate?: Populate;
            id: string;
        };

        type Find<Where, Transaction = ORM.Transaction, Populate = never> = {
            transaction?: Transaction;
            populate?: Populate;
            where: Where;
        };

        type FindMany<A extends Repositories.Mappers.Meta> = ORM.Utils.Pagination.Request<
            A["Filters"],
            A["Sort"][number]
        > & {
            populate?: A["Populate"];
        };
    }
}
