import { ProjectRepository, ProfileRepository } from "~context/infrastructure/repositories";
import { ProjectService } from "~context/domain/services/project.service";

declare global {
    namespace Integration.Domain.Project {
        interface Contract {
            repositories: Repositories.Signature;
            service: Service.Signature;
        }

        namespace Service {
            type Context = {
                repositories: Repositories.Context;
                projectService: ProjectService;
            };

            type Signature = (context: Integration.Postgres.Suite.FactoryContext) => Context;
        }

        namespace Repositories {
            type Context = {
                projects: ProjectRepository;
                profiles: ProfileRepository;
            };

            type Signature = (context: Integration.Postgres.Suite.FactoryContext) => Context;
        }
    }
}
