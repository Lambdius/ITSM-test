import { Field, GraphQLISODateTime, ID, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { Validator } from "~common/validator";

@InputType("ExperiencePatch")
class PatchDTO implements Partial<Entities.Experience.MutableFields> {
    @Field(() => String, { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsNonEmptyString(100)
    declare public company?: string;

    @Field(() => String, { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsNonEmptyString(100)
    declare public position?: string;

    @Field(() => String, { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsString()
    @Validator.MaxLength(10000)
    declare public achievements?: string;

    @Field(() => GraphQLISODateTime, { nullable: true })
    @Validator.IsUndefinable()
    @Validator.IsDate()
    declare public startDate?: Date;

    @Field(() => GraphQLISODateTime, { nullable: true })
    @Validator.IsOptional()
    @Validator.IsDate()
    declare public endDate?: Nullable<Date>;
}

@InputType("ExperienceUpdateInput")
export class ExperienceUpdateArgsDTO implements Omit<Services.Experience.Update.Props, "transaction"> {
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
