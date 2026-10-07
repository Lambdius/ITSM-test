import { randomUUID } from "node:crypto";

export class Experience implements Entities.Experience.Contract {
    public id: string;

    public createdAt: Date;
    public updatedAt: Nullable<Date> = null;

    public company: string;
    public position: string;
    public achievements: string;

    public startDate: Date;
    public endDate: Nullable<Date>;

    public profile: string;

    public constructor(props: Entities.Experience.ConstructorProps) {
        this.id = randomUUID();
        this.createdAt = new Date();

        this.company = props.company;
        this.position = props.position;
        this.achievements = props.achievements;

        this.startDate = props.startDate;
        this.endDate = props.endDate;

        this.profile = props.profile;
    }
}
