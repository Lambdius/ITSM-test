import { ProfileService } from "~context/domain/services/profile.service";
import { ProfileRepository } from "~context/infrastructure/repositories";

export class ProfileIntegrationHelpers implements Integration.Domain.Profile.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Profile.Service.Context {
        const repositories = this.repositories(context);
        return {
            profileService: new ProfileService(repositories.profiles),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Profile.Repositories.Context {
        return {
            profiles: new ProfileRepository(context.prisma),
        };
    }
}
