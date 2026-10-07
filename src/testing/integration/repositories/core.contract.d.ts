declare namespace Fixtures.Core {
    interface Contract {
        createExperience: CreateExperience.Signature;
        createProject: CreateProject.Signature;
        createProfile: CreateProfile.Signature;
        createSkill: CreateSkill.Signature;
    }

    namespace CreateProfile {
        type Props = Testing.EntityFactory.CreateProfile.Props;

        type Result = Promise<Entities.Profile>;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateSkill {
        type Props = Testing.EntityFactory.CreateSkill.Props & { profile: string };

        type Result = Promise<Entities.Skill>;

        type Signature = (props: Props) => Result;
    }

    namespace CreateExperience {
        type Props = Testing.EntityFactory.CreateExperience.Props & { profile: string };

        type Result = Promise<Entities.Experience>;

        type Signature = (props: Props) => Result;
    }

    namespace CreateProject {
        type Props = Testing.EntityFactory.CreateProject.Props & { profile: string };

        type Result = Promise<Entities.Project>;

        type Signature = (props: Props) => Result;
    }
}
