import { Field, ObjectType } from "@nestjs/graphql";

import { PageInfoDTO } from "~common/dto";

import { SkillEdgeDTO } from "./edge.dto";

@ObjectType("SkillConnection")
export class SkillConnectionDTO implements ORM.Utils.Pagination.Connection<Entities.Skill.Data> {
    @Field(() => [SkillEdgeDTO])
    declare public edges: SkillEdgeDTO[];

    @Field(() => PageInfoDTO)
    declare public pageInfo: PageInfoDTO;
}
