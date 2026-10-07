import { SkillRepository, ProfileRepository } from "~context/infrastructure/repositories";
import { SkillService } from "~context/domain/services/skill.service";

export class SkillIntegrationHelpers implements Integration.Domain.Skill.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Skill.Service.Context {
        const repositories = this.repositories(context);
        return {
            skillService: new SkillService(repositories.profiles),
            repositories,
        };
    }

    public repositories(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Skill.Repositories.Context {
        return {
            profiles: new ProfileRepository(context.prisma),
            skills: new SkillRepository(context.prisma),
        };
    }
}
