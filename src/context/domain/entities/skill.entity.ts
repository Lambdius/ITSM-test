import { randomUUID } from "node:crypto";

export class Skill implements Entities.Skill.Contract {
    public id: string;

    public createdAt: Date;
    public updatedAt: Nullable<Date> = null;

    public name: string;

    public profile: string;

    public constructor(props: Entities.Skill.ConstructorProps) {
        this.id = randomUUID();
        this.createdAt = new Date();

        this.name = props.name;

        this.profile = props.profile;
    }
}
