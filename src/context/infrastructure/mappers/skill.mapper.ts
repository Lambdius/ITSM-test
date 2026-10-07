import { ORMAdapter } from "~infrastructure/database/utils";

export class SkillMapper implements Repositories.Mappers.Contract<
    Repositories.Mappers.Skill.Where,
    Repositories.Mappers.Skill.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.Skill.Filters,
        basic: Repositories.Mappers.Skill.Where = {},
    ): Repositories.Mappers.Skill.Where {
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
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter(filters.createdAt);
        }
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyOrdinalFilter(filters.updatedAt);
        }
        return where;
    }

    public buildOptionsORM(
        sort: Maybe<Repositories.Mappers.Skill.Sort>,
    ): Repositories.Mappers.Options<Repositories.Mappers.Skill.Sort[number]["field"] | "id"> {
        return { orderBy: ORMAdapter.orderBy(sort, "createdAt") };
    }
}
