import { Mutation, Args, Info, Parent, ResolveField, Query, Resolver } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";

import { Population, PopulationRegistry } from "~context/infrastructure/populate";
import { PublicLinkOperator } from "~infrastructure/database/enums";
import { PROFILE_SERVICE } from "~context/domain/services";
import { DatabaseService } from "~infrastructure/database";
import { SuccessMessageDTO } from "~common/dto";
import {
    EXPERIENCE_REPOSITORY,
    PROJECT_REPOSITORY,
    PROFILE_REPOSITORY,
    SKILL_REPOSITORY,
} from "~context/infrastructure/repositories";
import {
    ExperienceConnectionDTO,
    ProfileGetByIdArgsDTO,
    ExperienceListArgsDTO,
    ProfileRestoreArgsDTO,
    ProfileConnectionDTO,
    ProfileRevokeArgsDTO,
    ProfileCreateArgsDTO,
    ProfileUpdateArgsDTO,
    ProjectConnectionDTO,
    ProfilePurgeArgsDTO,
    ProjectListArgsDTO,
    ProfileListArgsDTO,
    SkillConnectionDTO,
    SkillListArgsDTO,
    ProfileDTO,
} from "~context/interface/dto";

@Resolver(() => ProfileDTO)
export class ProfileResolver {
    public constructor(
        private readonly prisma: DatabaseService,
        @Inject(PROFILE_SERVICE)
        private readonly service: Services.Profile.Contract,
        @Inject(PROFILE_REPOSITORY)
        private readonly repository: Repositories.Profile.QueryContract,
        @Inject(SKILL_REPOSITORY)
        private readonly skillRepository: Repositories.Skill.QueryContract,
        @Inject(EXPERIENCE_REPOSITORY)
        private readonly experienceRepository: Repositories.Experience.QueryContract,
        @Inject(PROJECT_REPOSITORY)
        private readonly projectRepository: Repositories.Project.QueryContract,
    ) {}

    @Query(() => ProfileDTO, { nullable: true })
    public async profile(
        @Args() args: ProfileGetByIdArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Profile.QueryContract["findById"]> {
        const populate = PopulationRegistry.profile.fromGraphQL(info);
        if (args.id) {
            return this.repository.findById({ id: args.id, populate });
        }
        const result = await this.repository.findMany({ first: 1, populate });
        return result.edges[0]?.node ?? null;
    }

    @Query(() => ProfileConnectionDTO)
    public profiles(
        @Args() args: ProfileListArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Profile.QueryContract["findMany"]> {
        return this.repository.findMany({ ...args, populate: PopulationRegistry.profile.fromGraphQL(info) });
    }

    @ResolveField(() => SkillConnectionDTO)
    public skills(
        @Parent() profile: Entities.Profile.Data,
        @Args() args: SkillListArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Skill.QueryContract["findMany"]> {
        const loaded = Population.get(profile, "skills");
        return loaded
            ? Promise.resolve(loaded)
            : this.skillRepository.findMany({
                  populate: PopulationRegistry.skill.fromGraphQL(info),
                  ...args,
                  filter: { ...args.filter, profile: { predicate: PublicLinkOperator.EQUAL, value: [profile.id] } },
              });
    }

    @ResolveField(() => ExperienceConnectionDTO)
    public experience(
        @Parent() profile: Entities.Profile.Data,
        @Args() args: ExperienceListArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Experience.QueryContract["findMany"]> {
        const loaded = Population.get(profile, "experience");
        return loaded
            ? Promise.resolve(loaded)
            : this.experienceRepository.findMany({
                  populate: PopulationRegistry.experience.fromGraphQL(info),
                  ...args,
                  filter: { ...args.filter, profile: { predicate: PublicLinkOperator.EQUAL, value: [profile.id] } },
              });
    }

    @ResolveField(() => ProjectConnectionDTO)
    public projects(
        @Parent() profile: Entities.Profile.Data,
        @Args() args: ProjectListArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Project.QueryContract["findMany"]> {
        const loaded = Population.get(profile, "projects");
        return loaded
            ? Promise.resolve(loaded)
            : this.projectRepository.findMany({
                  populate: PopulationRegistry.project.fromGraphQL(info),
                  ...args,
                  filter: { ...args.filter, profile: { predicate: PublicLinkOperator.EQUAL, value: [profile.id] } },
              });
    }

    @Mutation(() => SuccessMessageDTO)
    public createProfile(
        @Args("input", { type: () => ProfileCreateArgsDTO })
        input: ProfileCreateArgsDTO,
    ): Services.Profile.Create.Result {
        return this.prisma.transaction((transaction) => this.service.create({ input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public updateProfile(
        @Args("input", { type: () => ProfileUpdateArgsDTO })
        input: ProfileUpdateArgsDTO,
    ): Services.Profile.Update.Result {
        return this.prisma.transaction((transaction) => this.service.update({ ...input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public purgeProfile(
        @Args("input", { type: () => ProfilePurgeArgsDTO })
        input: ProfilePurgeArgsDTO,
    ): Services.Profile.Purge.Result {
        return this.prisma.transaction((transaction) => this.service.purge({ ...input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public revokeProfile(
        @Args("input", { type: () => ProfileRevokeArgsDTO }) input: ProfileRevokeArgsDTO,
    ): Services.Profile.Revoke.Result {
        return this.prisma.transaction((transaction) => this.service.revoke({ ...input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public restoreProfile(
        @Args("input", { type: () => ProfileRestoreArgsDTO }) input: ProfileRestoreArgsDTO,
    ): Services.Profile.Restore.Result {
        return this.prisma.transaction((transaction) => this.service.restore({ ...input, transaction }));
    }
}
