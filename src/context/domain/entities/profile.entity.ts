import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

import { ProfessionalLink } from "../value-objects";

export class Profile implements Entities.Profile.Contract {
    public id: string;

    public createdAt: Date;
    public updatedAt: Nullable<Date> = null;
    public isRevoked = false;

    public name: string;
    public description: string;
    public links: ValueObjects.ProfessionalLink.Data[];

    public constructor(props: Entities.Profile.ConstructorProps) {
        this.id = randomUUID();
        this.createdAt = new Date();

        this.name = props.name;
        this.description = props.description;
        this.links = props.links.map((link) => new ProfessionalLink(link));
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({ message: "Cannot purge an active profile" });
        }
    }
}
