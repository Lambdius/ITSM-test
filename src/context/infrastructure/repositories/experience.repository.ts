import { Injectable } from "@nestjs/common";

import { PopulationRegistry } from "~context/infrastructure/populate";
import { ExperienceMapper } from "~context/infrastructure/mappers";
import { DatabaseService } from "~infrastructure/database";
import { Experience } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable()
export class ExperienceRepository
    extends BaseRepository<Entities.Experience, Repositories.Mappers.Experience.Types, "experience">({
        populate: (props) => PopulationRegistry.experience.build(props),
        Mapper: ExperienceMapper,
        Entity: Experience,
    })
    implements Repositories.Experience.Contract
{
    public override readonly resource = "experience";

    public constructor(prisma: DatabaseService) {
        super(prisma);
    }
}
