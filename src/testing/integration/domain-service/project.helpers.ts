import { ProjectRepository, ProfileRepository } from "~context/infrastructure/repositories";
import { ProjectService } from "~context/domain/services/project.service";

export class ProjectIntegrationHelpers implements Integration.Domain.Project.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Project.Service.Context {
        const repositories = this.repositories(context);
        return {
            projectService: new ProjectService(repositories.profiles),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Project.Repositories.Context {
        return {
            projects: new ProjectRepository(context.prisma),
            profiles: new ProfileRepository(context.prisma),
        };
    }
}
