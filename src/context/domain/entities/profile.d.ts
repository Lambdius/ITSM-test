declare namespace Entities {
    type Profile = Profile.Contract;

    namespace Profile {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt: Nullable<Date>;
            isRevoked: boolean;

            name: string;
            description: string;
            links: ValueObjects.ProfessionalLink.Data[];

            canPurge(): void;
        }

        type Data = Omit<Contract, "canPurge">;

        type MutableFields = Pick<Contract, "name" | "description" | "links">;

        type ConstructorProps = {
            name: string;
            description: string;
            links: ValueObjects.ProfessionalLink.Data[];
        };
    }
}
