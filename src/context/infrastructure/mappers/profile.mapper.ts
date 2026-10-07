import { ORMAdapter } from "~infrastructure/database/utils";

export class ProfileMapper implements Repositories.Mappers.Contract<
    Repositories.Mappers.Profile.Where,
    Repositories.Mappers.Profile.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.Profile.Filters,
        basic: Repositories.Mappers.Profile.Where = {},
    ): Repositories.Mappers.Profile.Where {
        const where = basic;
        if (filters.isRevoked !== undefined && filters.isRevoked !== null) {
            where.isRevoked = { equals: filters.isRevoked };
        }
        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.name) {
            where.name = ORMAdapter.applyStringFilter(filters.name);
        }
        if (filters.description) {
            where.description = ORMAdapter.applyStringFilter(filters.description);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter(filters.createdAt);
        }
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyOrdinalFilter(filters.updatedAt);
        }
        return where;
    }

    public buildOptionsORM(
        sort: Maybe<Repositories.Mappers.Profile.Sort>,
    ): Repositories.Mappers.Options<Repositories.Mappers.Profile.Sort[number]["field"] | "id"> {
        return { orderBy: ORMAdapter.orderBy(sort, "createdAt") };
    }
}
