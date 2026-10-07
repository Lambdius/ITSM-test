import { GraphQLISODateTime, Field, ID, ObjectType } from "@nestjs/graphql";

import { ProfessionalLinkDTO } from "../../professional-link";
import { ExperienceConnectionDTO } from "../../experience";
import { ProjectConnectionDTO } from "../../project";
import { SkillConnectionDTO } from "../../skill";

@ObjectType("Profile")
export class ProfileDTO implements Entities.Profile.Data {
    @Field(() => Boolean)
    declare public isRevoked: Entities.Profile.Data["isRevoked"];

    @Field(() => GraphQLISODateTime)
    declare public createdAt: Entities.Profile.Data["createdAt"];

    @Field(() => GraphQLISODateTime, { nullable: true })
    declare public updatedAt: Entities.Profile.Data["updatedAt"];

    @Field(() => ID)
    declare public id: Entities.Profile.Data["id"];

    @Field(() => String)
    declare public name: Entities.Profile.Data["name"];

    @Field(() => String)
    declare public description: Entities.Profile.Data["description"];

    @Field(() => [ProfessionalLinkDTO])
    declare public links: Entities.Profile.Data["links"];

    @Field(() => SkillConnectionDTO)
    declare public skills: ORM.Utils.Pagination.Connection<Entities.Skill.Data>;

    @Field(() => ExperienceConnectionDTO)
    declare public experience: ORM.Utils.Pagination.Connection<Entities.Experience.Data>;

    @Field(() => ProjectConnectionDTO)
    declare public projects: ORM.Utils.Pagination.Connection<Entities.Project.Data>;
}
