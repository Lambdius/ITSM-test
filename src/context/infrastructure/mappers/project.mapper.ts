import { ORMAdapter } from "~infrastructure/database/utils";

export class ProjectMapper implements Repositories.Mappers.Contract<
    Repositories.Mappers.Project.Where,
    Repositories.Mappers.Project.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.Project.Filters,
        basic: Repositories.Mappers.Project.Where = {},
    ): Repositories.Mappers.Project.Where {
        const where = basic;
        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.profile) {
            where.profile = ORMAdapter.applyStringFilter(filters.profile);
        }
        if (filters.name) {
            where.name = ORMAdapter.applyStringFilter(filters.name);
        }
        if (filters.url) {
            where.url = ORMAdapter.applyStringFilter(filters.url);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter(filters.createdAt);
        }
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyNullableOrdinalFilter(filters.updatedAt);
        }
        return where;
    }

    public buildOptionsORM(
        sort: Maybe<Repositories.Mappers.Project.Sort>,
    ): Repositories.Mappers.Options<Repositories.Mappers.Project.Sort[number]["field"] | "id"> {
        return { orderBy: ORMAdapter.orderBy(sort, "createdAt") };
    }
}
