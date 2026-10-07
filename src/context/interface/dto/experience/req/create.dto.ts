import { Field, GraphQLISODateTime, ID, InputType } from "@nestjs/graphql";

import { Validator } from "~common/validator";

@InputType("ExperienceCreateInput")
export class ExperienceCreateArgsDTO implements Entities.Experience.ConstructorProps {
    @Field(() => String)
    @Validator.IsNonEmptyString(100)
    declare public company: string;

    @Field(() => String)
    @Validator.IsNonEmptyString(100)
    declare public position: string;

    @Field(() => String)
    @Validator.IsString()
    @Validator.MaxLength(10000)
    declare public achievements: string;

    @Field(() => GraphQLISODateTime)
    @Validator.IsDate()
    declare public startDate: Date;

    @Field(() => GraphQLISODateTime, { nullable: true })
    @Validator.IsNullable()
    @Validator.IsDate()
    public endDate: Nullable<Date> = null;

    @Field(() => ID)
    @Validator.IsUUID("4")
    declare public profile: string;
}
