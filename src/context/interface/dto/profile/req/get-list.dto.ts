import { ArgsType, Field } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { ConnectionArgsDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { ProfileFiltersDTO } from "../utils/filters.dto";
import { ProfileSortDTO } from "../utils/sort.dto";

@ArgsType()
export class ProfileListArgsDTO
    extends ConnectionArgsDTO
    implements Repositories.Base.FindMany<Repositories.Mappers.Profile.Types>
{
    @Field(() => ProfileFiltersDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => ProfileFiltersDTO)
    public filter?: Nullable<ProfileFiltersDTO>;

    @Field(() => [ProfileSortDTO], { nullable: true })
    @Validator.IsOptional()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.ArrayMaxSize(1)
    @Validator.IsUniqueArray((item: ProfileSortDTO) => item?.field)
    @Validator.ValidateNested({ each: true })
    @Type(() => ProfileSortDTO)
    public orderBy?: Nullable<ProfileSortDTO[]>;
}
