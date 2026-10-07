import { Injectable } from "@nestjs/common";

import { PopulationRegistry } from "~context/infrastructure/populate";
import { ProfileMapper } from "~context/infrastructure/mappers";
import { DatabaseService } from "~infrastructure/database";
import { Profile } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable()
export class ProfileRepository
    extends BaseRepository<Entities.Profile, Repositories.Mappers.Profile.Types, "profile">({
        populate: (props) => PopulationRegistry.profile.build(props),
        Mapper: ProfileMapper,
        Entity: Profile,
    })
    implements Repositories.Profile.Contract
{
    public override readonly resource = "profile";

    public constructor(prisma: DatabaseService) {
        super(prisma);
    }
}
