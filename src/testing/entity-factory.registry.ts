import { Profile, Skill, Experience, Project } from "~context/domain/entities";

export class EntityFactoryRegistry implements Testing.EntityFactory.Contract {
    public createProfile(
        props: Testing.EntityFactory.CreateProfile.Props = {},
    ): Testing.EntityFactory.CreateProfile.Result {
        return this.entity(
            new Profile({
                name: props.name ?? "Test Profile",
                description: props.description ?? "Repository fixture",
                links: props.links ?? [
                    {
                        label: "GitHub",
                        url: "https://github.com/example",
                    },
                ],
            }),
            props,
        );
    }

    public createSkill(props: Testing.EntityFactory.CreateSkill.Props = {}): Testing.EntityFactory.CreateSkill.Result {
        return this.entity(
            new Skill({ profile: props.profile ?? this.createProfile().id, name: props.name ?? "Test Skill" }),
            props,
        );
    }

    public createExperience(
        props: Testing.EntityFactory.CreateExperience.Props = {},
    ): Testing.EntityFactory.CreateExperience.Result {
        return this.entity(
            new Experience({
                profile: props.profile ?? this.createProfile().id,
                company: props.company ?? "Test Company",
                position: props.position ?? "Developer",
                achievements: props.achievements ?? "Done",
                startDate: props.startDate ?? new Date("2024-01-01"),
                endDate: props.endDate ?? null,
            }),
            props,
        );
    }

    public createProject(
        props: Testing.EntityFactory.CreateProject.Props = {},
    ): Testing.EntityFactory.CreateProject.Result {
        return this.entity(
            new Project({
                profile: props.profile ?? this.createProfile().id,
                name: props.name ?? "Test Project",
                url: props.url ?? "https://example.com",
            }),
            props,
        );
    }

    private entity<Entity extends object>(entity: Entity, props: NoInfer<Partial<Entity>>): Entity {
        Object.assign(entity, props);
        return entity;
    }
}
