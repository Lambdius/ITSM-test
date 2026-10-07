import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("ProfessionalLink")
export class ProfessionalLinkDTO implements ValueObjects.ProfessionalLink.Data {
    @Field(() => String)
    declare public label: ValueObjects.ProfessionalLink.Data["label"];

    @Field(() => String)
    declare public url: ValueObjects.ProfessionalLink.Data["url"];
}
