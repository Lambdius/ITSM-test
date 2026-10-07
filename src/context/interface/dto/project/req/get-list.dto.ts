import { ArgsType, Field } from "@nestjs/graphql";
import { Type } from "class-transformer";

import { ConnectionArgsDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { ProjectFiltersDTO } from "../utils/filters.dto";
import { ProjectSortDTO } from "../utils/sort.dto";

@ArgsType()
export class ProjectListArgsDTO
    extends ConnectionArgsDTO
    implements Repositories.Base.FindMany<Repositories.Mappers.Project.Types>
{
    @Field(() => ProjectFiltersDTO, { nullable: true })
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => ProjectFiltersDTO)
    public filter?: Nullable<ProjectFiltersDTO>;

    @Field(() => [ProjectSortDTO], { nullable: true })
    @Validator.IsOptional()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.ArrayMaxSize(1)
    @Validator.IsUniqueArray((item: ProjectSortDTO) => item?.field)
    @Validator.ValidateNested({ each: true })
    @Type(() => ProjectSortDTO)
    public orderBy?: Nullable<ProjectSortDTO[]>;
}
