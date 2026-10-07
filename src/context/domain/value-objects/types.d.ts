declare namespace ValueObjects {
    type ProfessionalLink = ProfessionalLink.Contract;

    namespace ProfessionalLink {
        interface Contract {
            readonly label: string;
            readonly url: string;
        }

        type Data = Pick<Contract, keyof Contract>;

        type ConstructorProps = Data;
    }
}
