import { Field, InputType } from "@nestjs/graphql";

import { QueryOrder } from "~infrastructure/database/enums";
import { Validator } from "~common/validator";

import { ProfileOrderField } from "../enums";

@InputType("ProfileOrder")
export class ProfileSortDTO implements ORM.Utils.Pagination.Order<Repositories.Mappers.Profile.Sort[number]["field"]> {
    @Field(() => ProfileOrderField)
    @Validator.IsEnum(ProfileOrderField)
    declare public field: ProfileOrderField;

    @Field(() => QueryOrder)
    @Validator.IsEnum(QueryOrder)
    declare public direction: QueryOrder;
}
