import { Field, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { LinkFilterDTO, StringFilterDTO, OrdinalFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

@InputType("ProjectFilters")
export class ProjectFiltersDTO implements Repositories.Mappers.Project.Filters {
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
    @Validator.IsNonNullableFilter()
    public name?: Nullable<StringFilterDTO>;

    @Field(() => StringFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @Validator.IsNonNullableFilter()
    public url?: Nullable<StringFilterDTO>;

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
}
