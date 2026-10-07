import { FieldNode, GraphQLObjectType, GraphQLResolveInfo } from "graphql";

import { Population } from "./population";

declare global {
    namespace Repositories.Population {
        type Info = GraphQLResolveInfo;

        type Parent = { id: string };

        type Data<E> = ORM.EntityData<E> & Parent;

        type Row<E, A extends Repositories.Mappers.Meta> = Data<E> &
            Record<A["Sort"][number]["field"], ORM.Utils.Pagination.Value>;

        type Entity = Entities.Profile.Data | Entities.Skill.Data | Entities.Experience.Data | Entities.Project.Data;

        type Loaded<E extends Entity> = E extends Entities.Profile.Data
            ? {
                  skills: ORM.Utils.Pagination.Connection<Entities.Skill>;
                  experience: ORM.Utils.Pagination.Connection<Entities.Experience>;
                  projects: ORM.Utils.Pagination.Connection<Entities.Project>;
              }
            : { owner: Nullable<Entities.Profile> };

        type Fields = {
            fields: Map<string, FieldNode[]>;
            type: GraphQLObjectType;
        };

        type Definition<E, A extends Repositories.Mappers.Meta> = {
            resource: Repositories.Base.Resource;
            Entity: ORM.EntityClass<E>;

            Mapper: new () => Repositories.Mappers.Contract<A["Where"], A>;
            DTO: new () => Repositories.Base.FindMany<A>;

            relations(): Record<string, Optional<Relation>>;
        };

        type Relation = {
            target: Population<object, Repositories.Mappers.Meta>;
            foreignKey?: string;
        };

        type Plan<E> = {
            include: Record<string, object>;

            hydrate(row: Data<E>): E;
        };

        type PreparedRelation = {
            query: object;

            read(value: unknown, parent: Parent): unknown;
        };

        type Profile = {
            skills?: Repositories.Base.FindMany<Repositories.Mappers.Skill.Types>;
            experience?: Repositories.Base.FindMany<Repositories.Mappers.Experience.Types>;
            projects?: Repositories.Base.FindMany<Repositories.Mappers.Project.Types>;
        };

        type Experience = { owner?: Profile };

        type Project = { owner?: Profile };

        type Skill = { owner?: Profile };
    }
}
