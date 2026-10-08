import { Inject, Injectable } from "@nestjs/common";

import { PROFILE_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { Skill } from "../entities";

@Injectable()
export class SkillService implements Services.Skill.Contract {
    public constructor(
        @Inject(PROFILE_REPOSITORY)
        private readonly profileRepository: Repositories.Profile.Contract,
    ) {}

    public async create(props: Services.Skill.Create.Props): Services.Skill.Create.Result {
        const { transaction, input } = props;
        const profile = await this.profileRepository.findById({ id: input.profile, transaction });
        if (profile) {
            await transaction.profileSkill.create({ data: new Skill(input) });
            return { message: "Skill created successfully" };
        } else {
            throw Exception.notFound({ profile: input.profile }, "Profile not found");
        }
    }

    public async update(props: Services.Skill.Update.Props): Services.Skill.Update.Result {
        const { transaction, id, patch } = props;
        if (Object.keys(patch).length > 0) {
            await transaction.profileSkill.update({
                where: { id },
                data: { ...patch, updatedAt: new Date() },
            });
        }
        return { message: "Skill updated successfully" };
    }

    public async purge(props: Services.Skill.Purge.Props): Services.Skill.Purge.Result {
        const { transaction, identifiers } = props;
        const unique = Array.from(new Set(identifiers));
        const { count } = await transaction.profileSkill.deleteMany({ where: { id: { in: unique } } });
        if (count === unique.length) {
            return { message: "Skills purged successfully" };
        } else {
            throw Exception.notFound({ identifiers: unique }, "One or more skill records were not found");
        }
    }
}
