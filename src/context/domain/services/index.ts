import { ClassProvider } from "@nestjs/common";

import { ExperienceService } from "./experience.service";
import { ProjectService } from "./project.service";
import { ProfileService } from "./profile.service";
import { SkillService } from "./skill.service";

export const EXPERIENCE_SERVICE = Symbol("Services.Experience.Contract");
export const PROJECT_SERVICE = Symbol("Services.Project.Contract");
export const PROFILE_SERVICE = Symbol("Services.Profile.Contract");
export const SKILL_SERVICE = Symbol("Services.Skill.Contract");

export const DOMAIN_SERVICES: ClassProvider[] = [
    {
        provide: EXPERIENCE_SERVICE,
        useClass: ExperienceService,
    },
    {
        provide: PROJECT_SERVICE,
        useClass: ProjectService,
    },
    {
        provide: PROFILE_SERVICE,
        useClass: ProfileService,
    },
    {
        provide: SKILL_SERVICE,
        useClass: SkillService,
    },
];

export { ExperienceService, ProjectService, ProfileService, SkillService };
