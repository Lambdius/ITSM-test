import { Field, ID, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@InputType("ExperiencePurgeInput")
export class ExperiencePurgeArgsDTO implements Omit<Services.Experience.Purge.Props, "transaction"> {
    @Field(() => [ID])
    @Validator.IsUUIDArray()
    declare public identifiers: string[];
}
