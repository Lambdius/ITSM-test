import { Field, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";
import { PublicStringOperator } from "~infrastructure/database/enums";

@InputType("StringFilter")
export class StringFilterDTO {
    @Validator.IsEnum(PublicStringOperator)
    @Field(() => PublicStringOperator)
    declare public predicate: PublicStringOperator;

    @Validator.IsFilterValue()
    @Validator.IsString({ each: true })
    @Validator.MaxLength(100, { each: true })
    @Field(() => [String])
    declare public value: string[];
}
