import { ExperienceRepository, ProfileRepository } from "~context/infrastructure/repositories";
import { ExperienceService } from "~context/domain/services/experience.service";

export class ExperienceIntegrationHelpers implements Integration.Domain.Experience.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Experience.Service.Context {
        const repositories = this.repositories(context);
        return {
            experienceService: new ExperienceService(repositories.profiles),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Experience.Repositories.Context {
        return {
            experiences: new ExperienceRepository(context.prisma),
            profiles: new ProfileRepository(context.prisma),
        };
    }
}
