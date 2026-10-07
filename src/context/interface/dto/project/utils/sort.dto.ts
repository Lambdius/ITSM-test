import { Field, InputType } from "@nestjs/graphql";

import { QueryOrder } from "~infrastructure/database/enums";
import { Validator } from "~common/validator";

import { ProjectOrderField } from "../enums";

@InputType("ProjectOrder")
export class ProjectSortDTO implements ORM.Utils.Pagination.Order<Repositories.Mappers.Project.Sort[number]["field"]> {
    @Field(() => ProjectOrderField)
    @Validator.IsEnum(ProjectOrderField)
    declare public field: ProjectOrderField;

    @Field(() => QueryOrder)
    @Validator.IsEnum(QueryOrder)
    declare public direction: QueryOrder;
}
