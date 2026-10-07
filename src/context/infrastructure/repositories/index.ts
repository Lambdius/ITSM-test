import { ExperienceRepository } from "./experience.repository";
import { ProjectRepository } from "./project.repository";
import { ProfileRepository } from "./profile.repository";
import { SkillRepository } from "./skill.repository";

export const EXPERIENCE_REPOSITORY = Symbol("Repositories.Experience.Contract");
export const PROJECT_REPOSITORY = Symbol("Repositories.Project.Contract");
export const PROFILE_REPOSITORY = Symbol("Repositories.Profile.Contract");
export const SKILL_REPOSITORY = Symbol("Repositories.Skill.Contract");

export const REPOSITORIES = [
    {
        provide: EXPERIENCE_REPOSITORY,
        useClass: ExperienceRepository,
    },
    {
        provide: PROJECT_REPOSITORY,
        useClass: ProjectRepository,
    },
    {
        provide: PROFILE_REPOSITORY,
        useClass: ProfileRepository,
    },
    {
        provide: SKILL_REPOSITORY,
        useClass: SkillRepository,
    },
];

export { ExperienceRepository, ProjectRepository, ProfileRepository, SkillRepository };
