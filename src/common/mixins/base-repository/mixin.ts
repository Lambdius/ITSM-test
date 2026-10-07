import { CursorPagination, ORMAdapter } from "~infrastructure/database/utils";
import { QueryOrder } from "~infrastructure/database/enums";
import { ExceptionMapper } from "~common/exceptions";

export function BaseRepository<
    E extends object,
    A extends Repositories.Mappers.Meta,
    R extends Repositories.Base.Resource,
>({ Entity, Mapper, populate }: Repositories.Base.Mixin.Props<E, A>): Repositories.Base.Mixin.Result<E, A, R> {
    return class Mixin extends Mapper implements Repositories.Base.Contract<E, A, R> {
        declare public readonly resource: R;

        public constructor(protected readonly prisma: Repositories.Base.Client<E, A, R>) {
            super();
        }

        public async findById(
            props: Repositories.Base.FindById<Repositories.Base.Client<E, A, R>, A["Populate"]>,
        ): Promise<Nullable<E>> {
            try {
                const { transaction, id } = props;
                const plan = props.populate && populate?.(props.populate);
                const row = await (transaction ?? this.prisma)[this.resource].findUnique({
                    where: { id },
                    ...(plan && { include: plan.include, relationLoadStrategy: "join" }),
                });
                return row ? (plan ? plan.hydrate(row) : ORMAdapter.hydrate(Entity, row)) : null;
            } catch (error) {
                throw ExceptionMapper.fromPrisma(error);
            }
        }

        public async find(
            props: Repositories.Base.Find<A["Where"], Repositories.Base.Client<E, A, R>, A["Populate"]>,
        ): Promise<E[]> {
            try {
                const { transaction, where } = props;
                const plan = props.populate && populate?.(props.populate);
                const rows = await (transaction ?? this.prisma)[this.resource].findMany({
                    orderBy: [{ id: QueryOrder.ASC }],
                    ...(plan && { include: plan.include, relationLoadStrategy: "join" }),
                    where,
                });
                return rows.map((row) => (plan ? plan.hydrate(row) : ORMAdapter.hydrate(Entity, row)));
            } catch (error) {
                throw ExceptionMapper.fromPrisma(error);
            }
        }

        public async findMany(props: Repositories.Base.FindMany<A>): Promise<ORM.Utils.Pagination.Connection<E>> {
            try {
                const plan = props.populate && populate?.(props.populate);
                const where = super.buildWhereORM(props.filter ?? {});
                const page = new CursorPagination({
                    order: super.buildOptionsORM(props.orderBy).orderBy,
                    resource: this.resource,
                    first: props.first,
                    after: props.after,
                    filter: where,
                });
                const rows = await this.prisma[this.resource].findMany({
                    where: { AND: [where, page.where] },
                    orderBy: page.orderBy,
                    take: page.first + 1,
                    ...(plan && { include: plan.include, relationLoadStrategy: "join" }),
                });
                return page.connection({
                    rows,
                    map: (row) => (plan ? plan.hydrate(row) : ORMAdapter.hydrate(Entity, row)),
                });
            } catch (error) {
                throw ExceptionMapper.fromPrisma(error);
            }
        }
    };
}
