import { Inject, Injectable } from "@nestjs/common";

import { PROFILE_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { Profile } from "../entities";

@Injectable()
export class ProfileService implements Services.Profile.Contract {
    public constructor(
        @Inject(PROFILE_REPOSITORY)
        private readonly repository: Repositories.Profile.Contract,
    ) {}

    public async create(props: Services.Profile.Create.Props): Services.Profile.Create.Result {
        const { transaction, input } = props;
        await transaction.profile.create({ data: new Profile(input) });
        return { message: "Profile created successfully" };
    }

    public async update(props: Services.Profile.Update.Props): Services.Profile.Update.Result {
        const { transaction, id, patch } = props;
        await transaction.profile.update({ where: { id }, data: patch });
        return { message: "Profile updated successfully" };
    }

    public async revoke(props: Services.Profile.Revoke.Props): Services.Profile.Revoke.Result {
        const { transaction, identifiers } = props;
        const unique = Array.from(new Set(identifiers));
        const { count } = await transaction.profile.updateMany({
            data: { isRevoked: true, updatedAt: new Date() },
            where: { id: { in: unique } },
        });
        if (count === unique.length) {
            return { message: "Profiles revoked successfully" };
        } else {
            throw Exception.notFound({ identifiers: unique }, "One or more profile records were not found");
        }
    }

    public async restore(props: Services.Profile.Restore.Props): Services.Profile.Restore.Result {
        const { transaction, identifiers } = props;
        const unique = Array.from(new Set(identifiers));
        const { count } = await transaction.profile.updateMany({
            data: { isRevoked: false, updatedAt: new Date() },
            where: { id: { in: unique } },
        });
        if (count === unique.length) {
            return { message: "Profiles restored successfully" };
        } else {
            throw Exception.notFound({ identifiers: unique }, "One or more profile records were not found");
        }
    }

    public async purge(props: Services.Profile.Purge.Props): Services.Profile.Purge.Result {
        const { transaction, identifiers } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.repository.find({ where: { id: { in: unique } }, transaction });
        if (entities.length === unique.length) {
            for (const entity of entities) {
                entity.canPurge();
            }
            await transaction.profile.deleteMany({ where: { id: { in: unique } } });
            return { message: "Profiles purged successfully" };
        } else {
            throw Exception.notFound({ identifiers: unique }, "One or more profile records were not found");
        }
    }
}
