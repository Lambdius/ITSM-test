import { Inject, Injectable } from "@nestjs/common";

import { PROFILE_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { Project } from "../entities";

@Injectable()
export class ProjectService implements Services.Project.Contract {
    public constructor(
        @Inject(PROFILE_REPOSITORY)
        private readonly profileRepository: Repositories.Profile.Contract,
    ) {}

    public async create(props: Services.Project.Create.Props): Services.Project.Create.Result {
        const { transaction, input } = props;
        const profile = await this.profileRepository.findById({ id: input.profile, transaction });
        if (profile) {
            await transaction.project.create({ data: new Project(input) });
            return { message: "Project created successfully" };
        } else {
            throw Exception.notFound({ profile: input.profile }, "Profile not found");
        }
    }

    public async update(props: Services.Project.Update.Props): Services.Project.Update.Result {
        const { transaction, id, patch } = props;
        await transaction.project.update({ where: { id }, data: patch });
        return { message: "Project updated successfully" };
    }

    public async purge(props: Services.Project.Purge.Props): Services.Project.Purge.Result {
        const { transaction, identifiers } = props;
        const unique = Array.from(new Set(identifiers));
        const { count } = await transaction.project.deleteMany({ where: { id: { in: unique } } });
        if (count === unique.length) {
            return { message: "Projects purged successfully" };
        } else {
            throw Exception.notFound({ identifiers: unique }, "One or more project records were not found");
        }
    }
}
