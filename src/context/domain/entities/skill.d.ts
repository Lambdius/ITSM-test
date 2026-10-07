declare namespace Entities {
    type Skill = Skill.Contract;

    namespace Skill {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt: Nullable<Date>;

            name: string;

            profile: string;
        }

        type Data = Contract;

        type MutableFields = Pick<Contract, "name">;

        type ConstructorProps = {
            profile: string;
            name: string;
        };
    }
}
