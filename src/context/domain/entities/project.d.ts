declare namespace Entities {
    type Project = Project.Contract;

    namespace Project {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt: Nullable<Date>;

            name: string;
            url: string;

            profile: string;
        }

        type Data = Contract;

        type MutableFields = Pick<Contract, "name" | "url">;

        type ConstructorProps = {
            name: string;
            url: string;

            profile: string;
        };
    }
}
