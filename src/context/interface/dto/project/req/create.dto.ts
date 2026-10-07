import { Field, ID, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@InputType("ProjectCreateInput")
export class ProjectCreateArgsDTO implements Entities.Project.ConstructorProps {
    @Field(() => String)
    @Validator.IsNonEmptyString(100)
    declare public name: string;

    @Field(() => String)
    @Validator.IsHttpUrl()
    declare public url: string;

    @Field(() => ID)
    @Validator.IsUUID("4")
    declare public profile: string;
}
