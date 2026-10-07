import { ArgsType, Field, ID } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@ArgsType()
export class ExperienceGetByIdArgsDTO {
    @Field(() => ID)
    @Validator.IsUUID()
    declare public id: string;
}
