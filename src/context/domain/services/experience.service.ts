import { Inject, Injectable } from "@nestjs/common";

import { PROFILE_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { Experience } from "../entities";

@Injectable()
export class ExperienceService implements Services.Experience.Contract {
    public constructor(
        @Inject(PROFILE_REPOSITORY)
        private readonly profileRepository: Repositories.Profile.Contract,
    ) {}

    public async create(props: Services.Experience.Create.Props): Services.Experience.Create.Result {
        const { transaction, input } = props;
        const profile = await this.profileRepository.findById({ id: input.profile, transaction });
        if (profile) {
            await transaction.experience.create({ data: new Experience(input) });
            return { message: "Experience created successfully" };
        } else {
            throw Exception.notFound({ profile: input.profile }, "Profile not found");
        }
    }

    public async update(props: Services.Experience.Update.Props): Services.Experience.Update.Result {
        const { transaction, id, patch } = props;
        if (Object.keys(patch).length > 0) {
            await transaction.experience.update({
                where: { id },
                data: { ...patch, updatedAt: new Date() },
            });
        }
        return { message: "Experience updated successfully" };
    }

    public async purge(props: Services.Experience.Purge.Props): Services.Experience.Purge.Result {
        const { transaction, identifiers } = props;
        const unique = Array.from(new Set(identifiers));
        const { count } = await transaction.experience.deleteMany({ where: { id: { in: unique } } });
        if (count === unique.length) {
            return { message: "Experiences purged successfully" };
        } else {
            throw Exception.notFound({ identifiers: unique }, "One or more experience records were not found");
        }
    }
}
