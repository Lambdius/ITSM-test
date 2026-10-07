import { registerEnumType } from "@nestjs/graphql";

export enum SkillOrderField {
    CREATED_AT = "createdAt",
}

registerEnumType(SkillOrderField, { name: "SkillOrderField" });
