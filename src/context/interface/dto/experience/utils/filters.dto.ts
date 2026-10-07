import { Field, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { LinkFilterDTO, StringFilterDTO, OrdinalFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

@InputType("ExperienceFilters")
export class ExperienceFiltersDTO implements Repositories.Mappers.Experience.Filters {
    @Field(() => LinkFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    public id?: Nullable<LinkFilterDTO>;

    @Field(() => LinkFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    public profile?: Nullable<LinkFilterDTO>;

    @Field(() => StringFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    public company?: Nullable<StringFilterDTO>;

    @Field(() => StringFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    public position?: Nullable<StringFilterDTO>;

    @Field(() => OrdinalFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @Validator.IsNonNullableFilter()
    public createdAt?: Nullable<OrdinalFilterDTO<Date>>;

    @Field(() => OrdinalFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    public updatedAt?: Nullable<OrdinalFilterDTO<Date>>;

    @Field(() => OrdinalFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @Validator.IsNonNullableFilter()
    public startDate?: Nullable<OrdinalFilterDTO<Date>>;

    @Field(() => OrdinalFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    public endDate?: Nullable<OrdinalFilterDTO<Date>>;
}
