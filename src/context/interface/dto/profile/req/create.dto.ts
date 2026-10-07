import { Field, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { Validator } from "~common/validator";

import { ProfessionalLinkCreateArgsDTO } from "../../professional-link";

@InputType("ProfileCreateInput")
export class ProfileCreateArgsDTO implements Entities.Profile.ConstructorProps {
    @Field(() => String)
    @Validator.IsNonEmptyString(100)
    declare public name: string;

    @Field(() => String)
    @Validator.IsString()
    @Validator.MaxLength(10000)
    declare public description: string;

    @Field(() => [ProfessionalLinkCreateArgsDTO])
    @Validator.IsArray()
    @Validator.ArrayMaxSize(100)
    @Validator.ValidateNested({ each: true })
    @Type(() => ProfessionalLinkCreateArgsDTO)
    declare public links: ProfessionalLinkCreateArgsDTO[];
}
