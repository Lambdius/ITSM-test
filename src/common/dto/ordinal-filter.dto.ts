import { Field, InputType } from "@nestjs/graphql";

import { PublicOrdinalOperator } from "~infrastructure/database/enums";
import { Validator } from "~common/validator";

@InputType("OrdinalFilter")
export class OrdinalFilterDTO<T extends Ordinal> {
    @Validator.IsEnum(PublicOrdinalOperator)
    @Field(() => PublicOrdinalOperator)
    declare public predicate: PublicOrdinalOperator;

    @Validator.IsFilterValue()
    @Validator.IsDate({ each: true })
    @Field(() => [Date, Number])
    declare public value: T[];
}
