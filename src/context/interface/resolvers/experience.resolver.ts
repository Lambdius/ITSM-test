import { Mutation, Args, Info, Parent, ResolveField, Query, Resolver } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";

import { PROFILE_REPOSITORY, EXPERIENCE_REPOSITORY } from "~context/infrastructure/repositories";
import { Population, PopulationRegistry } from "~context/infrastructure/populate";
import { EXPERIENCE_SERVICE } from "~context/domain/services";
import { DatabaseService } from "~infrastructure/database";
import { SuccessMessageDTO } from "~common/dto";
import {
    ExperienceGetByIdArgsDTO,
    ExperienceConnectionDTO,
    ExperienceCreateArgsDTO,
    ExperienceUpdateArgsDTO,
    ExperiencePurgeArgsDTO,
    ExperienceListArgsDTO,
    ExperienceDTO,
    ProfileDTO,
} from "~context/interface/dto";

@Resolver(() => ExperienceDTO)
export class ExperienceResolver {
    public constructor(
        private readonly prisma: DatabaseService,
        @Inject(EXPERIENCE_SERVICE)
        private readonly service: Services.Experience.Contract,
        @Inject(EXPERIENCE_REPOSITORY)
        private readonly repository: Repositories.Experience.QueryContract,
        @Inject(PROFILE_REPOSITORY)
        private readonly profileRepository: Repositories.Profile.QueryContract,
    ) {}

    @Query(() => ExperienceDTO, { nullable: true })
    public experience(
        @Args() args: ExperienceGetByIdArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Experience.QueryContract["findById"]> {
        return this.repository.findById({ ...args, populate: PopulationRegistry.experience.fromGraphQL(info) });
    }

    @Query(() => ExperienceConnectionDTO)
    public experiences(
        @Args() args: ExperienceListArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Experience.QueryContract["findMany"]> {
        return this.repository.findMany({ ...args, populate: PopulationRegistry.experience.fromGraphQL(info) });
    }

    @ResolveField(() => ProfileDTO)
    public owner(
        @Parent() entity: Entities.Experience.Data,
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
    public createExperience(
        @Args("input", { type: () => ExperienceCreateArgsDTO })
        input: ExperienceCreateArgsDTO,
    ): Services.Experience.Create.Result {
        return this.prisma.transaction((transaction) => this.service.create({ input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public updateExperience(
        @Args("input", { type: () => ExperienceUpdateArgsDTO })
        input: ExperienceUpdateArgsDTO,
    ): Services.Experience.Update.Result {
        return this.prisma.transaction((transaction) => this.service.update({ ...input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public purgeExperience(
        @Args("input", { type: () => ExperiencePurgeArgsDTO })
        input: ExperiencePurgeArgsDTO,
    ): Services.Experience.Purge.Result {
        return this.prisma.transaction((transaction) => this.service.purge({ ...input, transaction }));
    }
}
