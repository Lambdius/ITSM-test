import { GraphQLISODateTime, Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType("Project")
export class ProjectDTO implements Entities.Project.Data {
    @Field(() => GraphQLISODateTime)
    declare public createdAt: Entities.Project.Data["createdAt"];

    @Field(() => GraphQLISODateTime, { nullable: true })
    declare public updatedAt: Entities.Project.Data["updatedAt"];

    @Field(() => ID)
    declare public id: Entities.Project.Data["id"];

    @Field(() => ID)
    declare public profile: Entities.Project.Data["profile"];

    @Field(() => String)
    declare public name: Entities.Project.Data["name"];

    @Field(() => String)
    declare public url: Entities.Project.Data["url"];
}
