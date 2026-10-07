import { ArgsType, Field, Int } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@ArgsType()
export class ConnectionArgsDTO {
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @Validator.Max(100)
    @Field(() => Int, { nullable: true, defaultValue: 20 })
    public first?: Nullable<number>;

    @Validator.IsOptional()
    @Validator.IsCursor()
    @Field(() => String, { nullable: true })
    public after?: Nullable<string>;
}
