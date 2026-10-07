import { Mutation, Args, Info, Parent, ResolveField, Query, Resolver } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";

import { PROFILE_REPOSITORY, SKILL_REPOSITORY } from "~context/infrastructure/repositories";
import { Population, PopulationRegistry } from "~context/infrastructure/populate";
import { DatabaseService } from "~infrastructure/database";
import { SKILL_SERVICE } from "~context/domain/services";
import { SuccessMessageDTO } from "~common/dto";
import {
    SkillGetByIdArgsDTO,
    SkillConnectionDTO,
    SkillCreateArgsDTO,
    SkillUpdateArgsDTO,
    SkillPurgeArgsDTO,
    SkillListArgsDTO,
    ProfileDTO,
    SkillDTO,
} from "~context/interface/dto";

@Resolver(() => SkillDTO)
export class SkillResolver {
    public constructor(
        private readonly prisma: DatabaseService,
        @Inject(SKILL_SERVICE)
        private readonly service: Services.Skill.Contract,
        @Inject(SKILL_REPOSITORY)
        private readonly repository: Repositories.Skill.QueryContract,
        @Inject(PROFILE_REPOSITORY)
        private readonly profileRepository: Repositories.Profile.QueryContract,
    ) {}

    @Query(() => SkillDTO, { nullable: true })
    public skill(
        @Args() args: SkillGetByIdArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Skill.QueryContract["findById"]> {
        return this.repository.findById({ ...args, populate: PopulationRegistry.skill.fromGraphQL(info) });
    }

    @Query(() => SkillConnectionDTO)
    public skills(
        @Args() args: SkillListArgsDTO,
        @Info() info: Repositories.Population.Info,
    ): ReturnType<Repositories.Skill.QueryContract["findMany"]> {
        return this.repository.findMany({ ...args, populate: PopulationRegistry.skill.fromGraphQL(info) });
    }

    @ResolveField(() => ProfileDTO)
    public owner(
        @Parent() entity: Entities.Skill.Data,
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
    public createSkill(
        @Args("input", { type: () => SkillCreateArgsDTO })
        input: SkillCreateArgsDTO,
    ): Services.Skill.Create.Result {
        return this.prisma.transaction((transaction) => this.service.create({ input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public updateSkill(
        @Args("input", { type: () => SkillUpdateArgsDTO })
        input: SkillUpdateArgsDTO,
    ): Services.Skill.Update.Result {
        return this.prisma.transaction((transaction) => this.service.update({ ...input, transaction }));
    }

    @Mutation(() => SuccessMessageDTO)
    public purgeSkill(
        @Args("input", { type: () => SkillPurgeArgsDTO }) input: SkillPurgeArgsDTO,
    ): Services.Skill.Purge.Result {
        return this.prisma.transaction((transaction) => this.service.purge({ ...input, transaction }));
    }
}
