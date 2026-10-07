import { ProfileService } from "~context/domain/services/profile.service";
import { ProfileRepository } from "~context/infrastructure/repositories";

declare global {
    namespace Integration.Domain.Profile {
        interface Contract {
            repositories: Repositories.Signature;
            service: Service.Signature;
        }

        namespace Service {
            type Context = {
                repositories: Repositories.Context;
                profileService: ProfileService;
            };

            type Signature = (context: Integration.Postgres.Suite.FactoryContext) => Context;
        }

        namespace Repositories {
            type Context = {
                profiles: ProfileRepository;
            };

            type Signature = (context: Integration.Postgres.Suite.FactoryContext) => Context;
        }
    }
}
