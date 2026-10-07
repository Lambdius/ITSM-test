import { Mutation, Args, Info, Parent, ResolveField, Query, Resolver } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";

import { PROFILE_REPOSITORY, PROJECT_REPOSITORY } from "~context/infrastructure/repositories";
import { Population, PopulationRegistry } from "~context/infrastructure/populate";
import { PROJECT_SERVICE } from "~context/domain/services";
import { DatabaseService } from "~infrastructure/database";
import { SuccessMessageDTO } from "~common/dto";
import {
    ProjectGetByIdArgsDTO,
    ProjectConnectionDTO,
    ProjectCreateArgsDTO,
    ProjectUpdateArgsDTO,
    ProjectPurgeArgsDTO,
    ProjectListArgsDTO,
    ProjectDTO,
    ProfileDTO,
} from "~context/interface/dto";

@Resolver(() => ProjectDTO)
export class ProjectResolver {
    public constructor(
        private readonly prisma: DatabaseService,
        @Inject(PROJECT_SERVICE)
        private readonly service: Services.Project.Contract,
        @Inject(PROJECT_REPOSITORY)
        private readonly repository: Repositories.Project.QueryContract,
        @Inject(PROFILE_REPOSITORY)
        private readonly profileRepository: Repositories.Profile.QueryContract,
    ) {}

    @Query(() => ProjectDTO, { nullable: true })
    public project(
        @Args() args: ProjectGetByIdArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Project.QueryContract["findById"]> {
        return this.repository.findById({ ...args, populate: PopulationRegistry.project.fromGraphQL(info) });
    }

    @Query(() => ProjectConnectionDTO)
    public projects(
        @Args() args: ProjectListArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Project.QueryContract["findMany"]> {
        return this.repository.findMany({ ...args, populate: PopulationRegistry.project.fromGraphQL(info) });
    }

    @ResolveField(() => ProfileDTO)
    public owner(
        @Parent() entity: Entities.Project.Data,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Profile.QueryContract["findById"]> {
        const loaded = Population.get(entity, "owner");
        return loaded
            ? Promise.resolve(loaded)
            : this.profileRepository.findById({
                  id: entity.profile,
                  populate: PopulationRegistry.profile.fromGraphQL(info),
              });
    }

    @Mutation(() => SuccessMessageDTO)
    public createProject(
        @Args("input", { type: () => ProjectCreateArgsDTO })
        input: ProjectCreateArgsDTO,
    ): Services.Project.Create.Result {
        return this.prisma.transaction((transaction) => this.service.create({ input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public updateProject(
        @Args("input", { type: () => ProjectUpdateArgsDTO })
        input: ProjectUpdateArgsDTO,
    ): Services.Project.Update.Result {
        return this.prisma.transaction((transaction) => this.service.update({ ...input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public purgeProject(
        @Args("input", { type: () => ProjectPurgeArgsDTO })
        input: ProjectPurgeArgsDTO,
    ): Services.Project.Purge.Result {
        return this.prisma.transaction((transaction) => this.service.purge({ ...input, transaction }));
    }
}
