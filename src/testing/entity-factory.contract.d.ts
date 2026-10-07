declare namespace Testing.EntityFactory {
    interface Contract {
        createExperience: CreateExperience.Signature;
        createProject: CreateProject.Signature;
        createProfile: CreateProfile.Signature;
        createSkill: CreateSkill.Signature;
    }

    namespace CreateProfile {
        type Props = Partial<Entities.Profile.Data>;

        type Result = Entities.Profile;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateSkill {
        type Props = Partial<Entities.Skill.Data>;

        type Result = Entities.Skill;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateExperience {
        type Props = Partial<Entities.Experience.Data>;

        type Result = Entities.Experience;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateProject {
        type Props = Partial<Entities.Project.Data>;

        type Result = Entities.Project;

        type Signature = (props?: Props) => Result;
    }
}
