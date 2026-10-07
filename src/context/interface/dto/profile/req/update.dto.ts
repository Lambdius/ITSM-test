import { Field, ID, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { Validator } from "~common/validator";

import { ProfessionalLinkCreateArgsDTO } from "../../professional-link";

@InputType("ProfilePatch")
class PatchDTO implements Partial<Entities.Profile.MutableFields> {
    @Field(() => String, { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsNonEmptyString(100)
    declare public name?: string;

    @Field(() => String, { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsString()
    @Validator.MaxLength(10000)
    declare public description?: string;

    @Field(() => [ProfessionalLinkCreateArgsDTO], { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsArray()
    @Validator.ArrayMaxSize(100)
    @Validator.ValidateNested({ each: true })
    @Type(() => ProfessionalLinkCreateArgsDTO)
    declare public links?: ProfessionalLinkCreateArgsDTO[];
}

@InputType("ProfileUpdateInput")
export class ProfileUpdateArgsDTO implements Omit<Services.Profile.Update.Props, "transaction"> {
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
