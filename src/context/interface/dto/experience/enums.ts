import { registerEnumType } from "@nestjs/graphql";

export enum ExperienceOrderField {
    CREATED_AT = "createdAt",
    START_DATE = "startDate",
}

registerEnumType(ExperienceOrderField, { name: "ExperienceOrderField" });
