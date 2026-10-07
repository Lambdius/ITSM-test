import { LinkFilterDTO, StringFilterDTO, OrdinalFilterDTO } from "~common/dto";
import { Prisma } from "~infrastructure/database/generated/client";

declare global {
    namespace Repositories.Mappers {
        type Meta = {
            Populate: object;
            Filters: object;
            Where: object;
            Sort: ORM.Utils.Pagination.Order[];
        };

        type Options<Field extends string> = {
            orderBy: ORM.Utils.Pagination.Column<Field>[];
        };

        interface Contract<Where, A extends Meta> {
            buildWhereORM(filters: A["Filters"], basic?: Where): Where;
            buildOptionsORM(sort: Maybe<A["Sort"]>): Options<A["Sort"][number]["field"] | "id">;
        }

        namespace Profile {
            type Filters = {
                isRevoked?: Nullable<boolean>;
                id?: Nullable<LinkFilterDTO>;
                name?: Nullable<StringFilterDTO>;
                description?: Nullable<StringFilterDTO>;
                createdAt?: Nullable<OrdinalFilterDTO<Date>>;
                updatedAt?: Nullable<OrdinalFilterDTO<Date>>;
            };

            type Sort = ORM.Utils.Pagination.Order<"createdAt">[];

            type Types = {
                Populate: Repositories.Population.Profile;
                Filters: Filters;
                Where: Where;
                Sort: Sort;
            };

            type Where = Prisma.ProfileWhereInput;
        }
        namespace Skill {
            type Filters = {
                id?: Nullable<LinkFilterDTO>;
                profile?: Nullable<LinkFilterDTO>;
                name?: Nullable<StringFilterDTO>;
                createdAt?: Nullable<OrdinalFilterDTO<Date>>;
                updatedAt?: Nullable<OrdinalFilterDTO<Date>>;
            };

            type Sort = ORM.Utils.Pagination.Order<"createdAt">[];

            type Types = {
                Populate: Repositories.Population.Skill;
                Filters: Filters;
                Where: Where;
                Sort: Sort;
            };

            type Where = Prisma.ProfileSkillWhereInput;
        }
        namespace Experience {
            type Filters = {
                id?: Nullable<LinkFilterDTO>;
                profile?: Nullable<LinkFilterDTO>;
                company?: Nullable<StringFilterDTO>;
                position?: Nullable<StringFilterDTO>;
                createdAt?: Nullable<OrdinalFilterDTO<Date>>;
                updatedAt?: Nullable<OrdinalFilterDTO<Date>>;
                startDate?: Nullable<OrdinalFilterDTO<Date>>;
                endDate?: Nullable<OrdinalFilterDTO<Date>>;
            };

            type Sort = ORM.Utils.Pagination.Order<"startDate" | "createdAt">[];

            type Types = {
                Populate: Repositories.Population.Experience;
                Filters: Filters;
                Where: Where;
                Sort: Sort;
            };

            type Where = Prisma.ExperienceWhereInput;
        }
        namespace Project {
            type Filters = {
                id?: Nullable<LinkFilterDTO>;
                profile?: Nullable<LinkFilterDTO>;
                name?: Nullable<StringFilterDTO>;
                url?: Nullable<StringFilterDTO>;
                createdAt?: Nullable<OrdinalFilterDTO<Date>>;
                updatedAt?: Nullable<OrdinalFilterDTO<Date>>;
            };

            type Sort = ORM.Utils.Pagination.Order<"createdAt">[];

            type Types = {
                Populate: Repositories.Population.Project;
                Filters: Filters;
                Where: Where;
                Sort: Sort;
            };

            type Where = Prisma.ProjectWhereInput;
        }
    }
}
