import { Field, ObjectType } from "@nestjs/graphql";

import { PageInfoDTO } from "~common/dto";

import { ExperienceEdgeDTO } from "./edge.dto";

@ObjectType("ExperienceConnection")
export class ExperienceConnectionDTO implements ORM.Utils.Pagination.Connection<Entities.Experience.Data> {
    @Field(() => [ExperienceEdgeDTO])
    declare public edges: ExperienceEdgeDTO[];

    @Field(() => PageInfoDTO)
    declare public pageInfo: PageInfoDTO;
}
