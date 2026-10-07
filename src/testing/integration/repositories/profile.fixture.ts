import { Skill } from "~context/domain/entities";

import { CoreFixture } from "./core.fixture";

export class ProfileFixture extends CoreFixture implements Fixtures.Profile.Contract {
    public async presentationScenario(): Fixtures.Profile.PresentationScenario.Result {
        const profile = await this.createProfile();
        const names = ["TypeScript", "JavaScript", "Node.js", "NestJS", "PostgreSQL", "Prisma", "GraphQL", "Docker", "Git"];
        await this.prisma.profileSkill.createMany({
            data: names.map((name) => new Skill({ profile: profile.id, name })),
        });
        await this.createExperience({
            profile: profile.id,
            startDate: new Date("2023-06-01T00:00:00.000Z"),
            achievements: "Completed integration project",
        });
        await this.createProject({ profile: profile.id });
        return profile;
    }

    public async duplicateSortValuesScenario(): Fixtures.Profile.DuplicateSortValuesScenario.Result {
        const createdAt = new Date("2024-01-01");
        const first = await this.createProfile({ createdAt });
        const second = await this.createProfile({ createdAt });
        return { first, second };
    }
}
