import { Field, InputType } from "@nestjs/graphql";

import { QueryOrder } from "~infrastructure/database/enums";
import { Validator } from "~common/validator";

import { ExperienceOrderField } from "../enums";

@InputType("ExperienceOrder")
export class ExperienceSortDTO implements ORM.Utils.Pagination.Order<
    Repositories.Mappers.Experience.Sort[number]["field"]
> {
    @Field(() => ExperienceOrderField)
    @Validator.IsEnum(ExperienceOrderField)
    declare public field: ExperienceOrderField;

    @Field(() => QueryOrder)
    @Validator.IsEnum(QueryOrder)
    declare public direction: QueryOrder;
}
