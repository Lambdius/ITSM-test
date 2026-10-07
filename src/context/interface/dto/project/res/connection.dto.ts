import { Field, ObjectType } from "@nestjs/graphql";

import { PageInfoDTO } from "~common/dto";

import { ProjectEdgeDTO } from "./edge.dto";

@ObjectType("ProjectConnection")
export class ProjectConnectionDTO implements ORM.Utils.Pagination.Connection<Entities.Project.Data> {
    @Field(() => [ProjectEdgeDTO])
    declare public edges: ProjectEdgeDTO[];

    @Field(() => PageInfoDTO)
    declare public pageInfo: PageInfoDTO;
}
