import { GraphQLISODateTime, Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType("Experience")
export class ExperienceDTO implements Entities.Experience.Data {
    @Field(() => GraphQLISODateTime)
    declare public createdAt: Entities.Experience.Data["createdAt"];

    @Field(() => GraphQLISODateTime, { nullable: true })
    declare public updatedAt: Entities.Experience.Data["updatedAt"];

    @Field(() => ID)
    declare public id: Entities.Experience.Data["id"];

    @Field(() => ID)
    declare public profile: Entities.Experience.Data["profile"];

    @Field(() => String)
    declare public company: Entities.Experience.Data["company"];

    @Field(() => String)
    declare public position: Entities.Experience.Data["position"];

    @Field(() => GraphQLISODateTime)
    declare public startDate: Entities.Experience.Data["startDate"];

    @Field(() => GraphQLISODateTime, { nullable: true })
    declare public endDate: Entities.Experience.Data["endDate"];

    @Field(() => String)
    declare public achievements: Entities.Experience.Data["achievements"];
}
