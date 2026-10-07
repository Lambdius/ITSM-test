import { Field, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { LinkFilterDTO, StringFilterDTO, OrdinalFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

@InputType("ProfileFilters")
export class ProfileFiltersDTO implements Repositories.Mappers.Profile.Filters {
    @Field(() => Boolean, { nullable: true })
    @Validator.IsOptional()
    @Validator.IsBoolean()
    declare public isRevoked?: Nullable<boolean>;

    @Field(() => LinkFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    public id?: Nullable<LinkFilterDTO>;

    @Field(() => StringFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    public name?: Nullable<StringFilterDTO>;

    @Field(() => StringFilterDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    public description?: Nullable<StringFilterDTO>;
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
