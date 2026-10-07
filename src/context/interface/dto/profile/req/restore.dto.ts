import { Field, ID, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@InputType("ProfileRestoreInput")
export class ProfileRestoreArgsDTO implements Omit<Services.Profile.Restore.Props, "transaction"> {
    @Field(() => [ID])
    @Validator.IsUUIDArray()
    declare public identifiers: string[];
}
