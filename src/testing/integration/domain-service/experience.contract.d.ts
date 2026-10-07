import { ExperienceRepository, ProfileRepository } from "~context/infrastructure/repositories";
import { ExperienceService } from "~context/domain/services/experience.service";

declare global {
    namespace Integration.Domain.Experience {
        interface Contract {
            repositories: Repositories.Signature;
            service: Service.Signature;
        }

        namespace Service {
            type Context = {
                experienceService: ExperienceService;
                repositories: Repositories.Context;
            };

            type Signature = (context: Integration.Postgres.Suite.FactoryContext) => Context;
        }

        namespace Repositories {
            type Context = {
                experiences: ExperienceRepository;
                profiles: ProfileRepository;
            };

            type Signature = (context: Integration.Postgres.Suite.FactoryContext) => Context;
        }
    }
}
