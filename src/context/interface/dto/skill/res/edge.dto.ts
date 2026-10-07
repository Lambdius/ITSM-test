import { Field, ObjectType } from "@nestjs/graphql";

import { SkillDTO } from "./entity.dto";

@ObjectType("SkillEdge")
export class SkillEdgeDTO implements ORM.Utils.Pagination.Edge<Entities.Skill.Data> {
    @Field(() => String)
    declare public cursor: string;

    @Field(() => SkillDTO)
    declare public node: Entities.Skill.Data;
}
