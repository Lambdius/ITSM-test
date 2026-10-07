import { Field, ObjectType } from "@nestjs/graphql";

import { ExperienceDTO } from "./entity.dto";

@ObjectType("ExperienceEdge")
export class ExperienceEdgeDTO implements ORM.Utils.Pagination.Edge<Entities.Experience.Data> {
    @Field(() => String)
    declare public cursor: string;

    @Field(() => ExperienceDTO)
    declare public node: Entities.Experience.Data;
}
