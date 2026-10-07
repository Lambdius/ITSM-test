import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import { DatabaseService } from "~infrastructure/database";

export class CoreFixture implements Fixtures.Core.Contract {
    private readonly entities = new EntityFactoryRegistry();

    public constructor(protected readonly prisma: DatabaseService) {}

    public async createProfile(props: Fixtures.Core.CreateProfile.Props = {}): Fixtures.Core.CreateProfile.Result {
        const entity = this.entities.createProfile(props);
        await this.prisma.profile.create({ data: entity });
        return entity;
    }

    public async createSkill(props: Fixtures.Core.CreateSkill.Props): Fixtures.Core.CreateSkill.Result {
        const entity = this.entities.createSkill(props);
        await this.prisma.profileSkill.create({ data: entity });
        return entity;
    }

    public async createExperience(props: Fixtures.Core.CreateExperience.Props): Fixtures.Core.CreateExperience.Result {
        const entity = this.entities.createExperience(props);
        await this.prisma.experience.create({ data: entity });
        return entity;
    }

    public async createProject(props: Fixtures.Core.CreateProject.Props): Fixtures.Core.CreateProject.Result {
        const entity = this.entities.createProject(props);
        await this.prisma.project.create({ data: entity });
        return entity;
    }
}
