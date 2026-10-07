import { Field, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";
import { PublicLinkOperator } from "~infrastructure/database/enums";

@InputType("LinkFilter")
export class LinkFilterDTO {
    @Validator.IsEnum(PublicLinkOperator)
    @Field(() => PublicLinkOperator)
    declare public predicate: PublicLinkOperator;

    @Validator.IsFilterValue()
    @Validator.IsUUID("all", { each: true })
    @Field(() => [String])
    declare public value: string[];
}
