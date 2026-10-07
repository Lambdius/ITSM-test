import { ProfileResolver } from "./profile.resolver";
import { SkillResolver } from "./skill.resolver";
import { ExperienceResolver } from "./experience.resolver";
import { ProjectResolver } from "./project.resolver";

export * from "./profile.resolver";
export * from "./skill.resolver";
export * from "./experience.resolver";
export * from "./project.resolver";

export const RESOLVERS = [ProfileResolver, SkillResolver, ExperienceResolver, ProjectResolver];
