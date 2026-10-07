import { Field, ID, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { Validator } from "~common/validator";

@InputType("ProjectPatch")
class PatchDTO implements Partial<Entities.Project.MutableFields> {
    @Field(() => String, { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsNonEmptyString(100)
    declare public name?: string;

    @Field(() => String, { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsHttpUrl()
    declare public url?: string;
}

@InputType("ProjectUpdateInput")
export class ProjectUpdateArgsDTO implements Omit<Services.Project.Update.Props, "transaction"> {
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
