import { Field, ID, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@InputType("ProjectPurgeInput")
export class ProjectPurgeArgsDTO implements Omit<Services.Project.Purge.Props, "transaction"> {
    @Field(() => [ID])
    @Validator.IsUUIDArray()
    declare public identifiers: string[];
}
