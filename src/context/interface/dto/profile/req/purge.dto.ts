import { Field, ID, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@InputType("ProfilePurgeInput")
export class ProfilePurgeArgsDTO implements Omit<Services.Profile.Purge.Props, "transaction"> {
    @Field(() => [ID])
    @Validator.IsUUIDArray()
    declare public identifiers: string[];
}
