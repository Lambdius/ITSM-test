import { registerEnumType } from "@nestjs/graphql";

export enum ProjectOrderField {
    CREATED_AT = "createdAt",
}

registerEnumType(ProjectOrderField, { name: "ProjectOrderField" });
