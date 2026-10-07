import { Field, ID, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@InputType("ProfileRevokeInput")
export class ProfileRevokeArgsDTO implements Omit<Services.Profile.Revoke.Props, "transaction"> {
    @Field(() => [ID])
    @Validator.IsUUIDArray()
    declare public identifiers: string[];
}
