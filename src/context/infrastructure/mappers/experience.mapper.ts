import { QueryOrder } from "~infrastructure/database/enums";
import { ORMAdapter } from "~infrastructure/database/utils";

export class ExperienceMapper implements Repositories.Mappers.Contract<
    Repositories.Mappers.Experience.Where,
    Repositories.Mappers.Experience.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.Experience.Filters,
        basic: Repositories.Mappers.Experience.Where = {},
    ): Repositories.Mappers.Experience.Where {
        const where = basic;
        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.profile) {
            where.profile = ORMAdapter.applyStringFilter(filters.profile);
        }
        if (filters.company) {
            where.company = ORMAdapter.applyStringFilter(filters.company);
        }
        if (filters.position) {
            where.position = ORMAdapter.applyStringFilter(filters.position);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter(filters.createdAt);
        }
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyOrdinalFilter(filters.updatedAt);
        }
        if (filters.startDate) {
            where.startDate = ORMAdapter.applyOrdinalFilter(filters.startDate);
        }
        if (filters.endDate) {
            where.endDate = ORMAdapter.applyOrdinalFilter(filters.endDate);
        }
        return where;
    }

    public buildOptionsORM(
        sort: Maybe<Repositories.Mappers.Experience.Sort>,
    ): Repositories.Mappers.Options<Repositories.Mappers.Experience.Sort[number]["field"] | "id"> {
        return {
            orderBy: ORMAdapter.orderBy(sort, "startDate", QueryOrder.DESC),
        };
    }
}
