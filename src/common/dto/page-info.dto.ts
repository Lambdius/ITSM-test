import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("PageInfo")
export class PageInfoDTO implements ORM.Utils.Pagination.PageInfo {
    @Field(() => Boolean)
    declare public hasNextPage: boolean;

    @Field(() => Boolean)
    declare public hasPreviousPage: boolean;

    @Field(() => String, { nullable: true })
    declare public startCursor: Nullable<string>;

    @Field(() => String, { nullable: true })
    declare public endCursor: Nullable<string>;
}
