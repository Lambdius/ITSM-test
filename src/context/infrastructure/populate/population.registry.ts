import { ProfileListArgsDTO, SkillListArgsDTO, ExperienceListArgsDTO, ProjectListArgsDTO } from "~context/interface/dto";
import { ProfileMapper, SkillMapper, ExperienceMapper, ProjectMapper } from "~context/infrastructure/mappers";
import { Profile, Skill, Experience, Project } from "~context/domain/entities";

import { Population } from "./population";

export class PopulationRegistry {
    public static readonly profile: Population<Entities.Profile, Repositories.Mappers.Profile.Types> = new Population({
        resource: "profile",
        Entity: Profile,
        Mapper: ProfileMapper,
        DTO: ProfileListArgsDTO,
        relations: () => ({
            experience: { target: this.experience, foreignKey: "profile" },
            projects: { target: this.project, foreignKey: "profile" },
            skills: { target: this.skill, foreignKey: "profile" },
        }),
    });

    public static readonly skill: Population<Entities.Skill, Repositories.Mappers.Skill.Types> = new Population({
        resource: "profileSkill",
        Entity: Skill,
        Mapper: SkillMapper,
        DTO: SkillListArgsDTO,
        relations: () => ({ owner: { target: this.profile } }),
    });

    public static readonly experience: Population<Entities.Experience, Repositories.Mappers.Experience.Types> =
        new Population({
            resource: "experience",
            Entity: Experience,
            Mapper: ExperienceMapper,
            DTO: ExperienceListArgsDTO,
            relations: () => ({ owner: { target: this.profile } }),
        });

    public static readonly project: Population<Entities.Project, Repositories.Mappers.Project.Types> = new Population({
        resource: "project",
        Entity: Project,
        Mapper: ProjectMapper,
        DTO: ProjectListArgsDTO,
        relations: () => ({ owner: { target: this.profile } }),
    });
}
