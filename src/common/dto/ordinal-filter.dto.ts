import { Field, GraphQLISODateTime, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";
import { PublicOrdinalOperator } from "~infrastructure/database/enums";

@InputType("OrdinalFilter")
export class OrdinalFilterDTO<T extends Ordinal = Date> {
    @Validator.IsEnum(PublicOrdinalOperator)
    @Field(() => PublicOrdinalOperator)
    declare public predicate: PublicOrdinalOperator;

    @Validator.IsFilterValue()
    @Validator.IsDate({ each: true })
    @Field(() => [GraphQLISODateTime])
    declare public value: T[];
}
