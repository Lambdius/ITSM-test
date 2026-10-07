import { ArgsType, Field } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { ConnectionArgsDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { SkillFiltersDTO } from "../utils/filters.dto";
import { SkillSortDTO } from "../utils/sort.dto";

@ArgsType()
export class SkillListArgsDTO
    extends ConnectionArgsDTO
    implements Repositories.Base.FindMany<Repositories.Mappers.Skill.Types>
{
    @Field(() => SkillFiltersDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => SkillFiltersDTO)
    public filter?: Nullable<SkillFiltersDTO>;

    @Field(() => [SkillSortDTO], { nullable: true })
    @Validator.IsOptional()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.ArrayMaxSize(1)
    @Validator.IsUniqueArray((item: SkillSortDTO) => item?.field)
    @Validator.ValidateNested({ each: true })
    @Type(() => SkillSortDTO)
    public orderBy?: Nullable<SkillSortDTO[]>;
}
