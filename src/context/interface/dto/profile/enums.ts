import { registerEnumType } from "@nestjs/graphql";

export enum ProfileOrderField {
    CREATED_AT = "createdAt",
}

registerEnumType(ProfileOrderField, { name: "ProfileOrderField" });
