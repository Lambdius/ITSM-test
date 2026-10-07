import { ArgsType, Field } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { ConnectionArgsDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { ExperienceFiltersDTO } from "../utils/filters.dto";
import { ExperienceSortDTO } from "../utils/sort.dto";

@ArgsType()
export class ExperienceListArgsDTO
    extends ConnectionArgsDTO
    implements Repositories.Base.FindMany<Repositories.Mappers.Experience.Types>
{
    @Field(() => ExperienceFiltersDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => ExperienceFiltersDTO)
    public filter?: Nullable<ExperienceFiltersDTO>;

    @Field(() => [ExperienceSortDTO], { nullable: true })
    @Validator.IsOptional()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.ArrayMaxSize(2)
    @Validator.IsUniqueArray((item: ExperienceSortDTO) => item?.field)
    @Validator.ValidateNested({ each: true })
    @Type(() => ExperienceSortDTO)
    public orderBy?: Nullable<ExperienceSortDTO[]>;
}
