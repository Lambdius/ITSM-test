import { Field, ID, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@InputType("SkillCreateInput")
export class SkillCreateArgsDTO implements Entities.Skill.ConstructorProps {
    @Field(() => String)
    @Validator.IsNonEmptyString(100)
    declare public name: string;

    @Field(() => ID)
    @Validator.IsUUID("4")
    declare public profile: string;
}
