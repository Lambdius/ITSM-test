import { ArgsType, Field, ID } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@ArgsType()
export class ProfileGetByIdArgsDTO {
    @Field(() => ID, { nullable: true })
    @Validator.IsOptional()
    @Validator.IsUUID()
    declare public id?: Nullable<string>;
}
