import { Field, ID, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { Validator } from "~common/validator";

@InputType("SkillPatch")
class PatchDTO implements Partial<Entities.Skill.MutableFields> {
    @Field(() => String, { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsNonEmptyString(100)
    declare public name?: string;
}

@InputType("SkillUpdateInput")
export class SkillUpdateArgsDTO implements Omit<Services.Skill.Update.Props, "transaction"> {
    @Field(() => ID)
    @Validator.IsUUID("4")
    declare public id: string;

    @Field(() => PatchDTO)
    @Validator.IsRequired()
    @Validator.IsObject()
    @Validator.ValidateNested()
    @Type(() => PatchDTO)
    declare public patch: PatchDTO;
}
