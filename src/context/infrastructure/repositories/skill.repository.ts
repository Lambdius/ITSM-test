import { Injectable } from "@nestjs/common";

import { PopulationRegistry } from "~context/infrastructure/populate";
import { SkillMapper } from "~context/infrastructure/mappers";
import { DatabaseService } from "~infrastructure/database";
import { Skill } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable()
export class SkillRepository
    extends BaseRepository<Entities.Skill, Repositories.Mappers.Skill.Types, "profileSkill">({
        populate: (props) => PopulationRegistry.skill.build(props),
        Mapper: SkillMapper,
        Entity: Skill,
    })
    implements Repositories.Skill.Contract
{
    public override readonly resource = "profileSkill";

    public constructor(prisma: DatabaseService) {
        super(prisma);
    }
}
