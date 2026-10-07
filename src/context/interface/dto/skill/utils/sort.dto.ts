import { Field, InputType } from "@nestjs/graphql";

import { QueryOrder } from "~infrastructure/database/enums";
import { Validator } from "~common/validator";

import { SkillOrderField } from "../enums";

@InputType("SkillOrder")
export class SkillSortDTO implements ORM.Utils.Pagination.Order<Repositories.Mappers.Skill.Sort[number]["field"]> {
    @Field(() => SkillOrderField)
    @Validator.IsEnum(SkillOrderField)
    declare public field: SkillOrderField;

    @Field(() => QueryOrder)
    @Validator.IsEnum(QueryOrder)
    declare public direction: QueryOrder;
}
