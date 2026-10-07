import { Field, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@InputType("ProfessionalLinkInput")
export class ProfessionalLinkCreateArgsDTO implements ValueObjects.ProfessionalLink.Contract {
    @Field(() => String)
    @Validator.IsNonEmptyString(100)
    declare public label: string;

    @Field(() => String)
    @Validator.IsHttpUrl()
    declare public url: string;
}
