import { Field, ObjectType } from "@nestjs/graphql";

import { ProjectDTO } from "./entity.dto";

@ObjectType("ProjectEdge")
export class ProjectEdgeDTO implements ORM.Utils.Pagination.Edge<Entities.Project.Data> {
    @Field(() => String)
    declare public cursor: string;

    @Field(() => ProjectDTO)
    declare public node: Entities.Project.Data;
}
