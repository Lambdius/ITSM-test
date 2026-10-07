import { Injectable } from "@nestjs/common";

import { PopulationRegistry } from "~context/infrastructure/populate";
import { ProjectMapper } from "~context/infrastructure/mappers";
import { DatabaseService } from "~infrastructure/database";
import { Project } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable()
export class ProjectRepository
    extends BaseRepository<Entities.Project, Repositories.Mappers.Project.Types, "project">({
        populate: (props) => PopulationRegistry.project.build(props),
        Mapper: ProjectMapper,
        Entity: Project,
    })
    implements Repositories.Project.Contract
{
    public override readonly resource = "project";

    public constructor(prisma: DatabaseService) {
        super(prisma);
    }
}
