export class ProfessionalLink implements ValueObjects.ProfessionalLink.Contract {
    public readonly label: string;
    public readonly url: string;

    public constructor(props: ValueObjects.ProfessionalLink.ConstructorProps) {
        this.label = props.label;
        this.url = props.url;
        Object.freeze(this);
    }
}
