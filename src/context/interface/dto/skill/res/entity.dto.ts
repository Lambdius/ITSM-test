import { GraphQLISODateTime, Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType("Skill")
export class SkillDTO implements Entities.Skill.Data {
    @Field(() => GraphQLISODateTime)
    declare public createdAt: Entities.Skill.Data["createdAt"];

    @Field(() => GraphQLISODateTime, { nullable: true })
    declare public updatedAt: Entities.Skill.Data["updatedAt"];

    @Field(() => ID)
    declare public id: Entities.Skill.Data["id"];

    @Field(() => ID)
    declare public profile: Entities.Skill.Data["profile"];

    @Field(() => String)
    declare public name: Entities.Skill.Data["name"];
}
