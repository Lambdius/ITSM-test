import { randomUUID } from "node:crypto";

export class Project implements Entities.Project.Contract {
    public id: string;

    public createdAt: Date;
    public updatedAt: Nullable<Date> = null;

    public name: string;
    public url: string;

    public profile: string;

    public constructor(props: Entities.Project.ConstructorProps) {
        this.id = randomUUID();
        this.createdAt = new Date();

        this.name = props.name;
        this.url = props.url;

        this.profile = props.profile;
    }
}
