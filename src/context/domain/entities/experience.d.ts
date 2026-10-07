declare namespace Entities {
    type Experience = Experience.Contract;

    namespace Experience {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt: Nullable<Date>;

            company: string;
            position: string;
            achievements: string;

            startDate: Date;
            endDate: Nullable<Date>;

            profile: string;
        }

        type Data = Contract;

        type MutableFields = Pick<Contract, "company" | "position" | "achievements" | "startDate" | "endDate">;

        type ConstructorProps = {
            profile: string;
            company: string;
            position: string;
            achievements: string;
            startDate: Date;
            endDate: Nullable<Date>;
        };
    }
}
