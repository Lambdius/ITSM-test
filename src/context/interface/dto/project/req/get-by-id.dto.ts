import { ArgsType, Field, ID } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@ArgsType()
export class ProjectGetByIdArgsDTO {
    @Field(() => ID)
    @Validator.IsUUID()
    declare public id: string;
}
