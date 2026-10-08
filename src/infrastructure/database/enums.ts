import { registerEnumType } from "@nestjs/graphql";

export enum PublicStringOperator {
    /* eslint-disable prettier/prettier */
    EQUAL     = "EQUAL",
    NOT_EQUAL = "NOT_EQUAL",
    IN        = "IN",
    NOT_IN    = "NOT_IN",
    LIKE      = "LIKE",
    ILIKE     = "ILIKE",
    IS_NULL   = "IS_NULL",
    IS_NOT_NULL = "IS_NOT_NULL",
    /* eslint-enable prettier/prettier */
}

export enum PublicLinkOperator {
    /* eslint-disable prettier/prettier */
    EQUAL     = "EQUAL",
    NOT_EQUAL = "NOT_EQUAL",
    IN        = "IN",
    NOT_IN    = "NOT_IN",
    /* eslint-enable prettier/prettier */
}

export enum QueryOrder {
    /* eslint-disable prettier/prettier */
    ASC  = "asc",
    DESC = "desc",
    /* eslint-enable prettier/prettier */
}

export enum PublicOrdinalOperator {
    /* eslint-disable prettier/prettier */
    EQUAL            = "EQUAL",
    NOT_EQUAL        = "NOT_EQUAL",
    GREATER_THAN     = "GREATER_THAN",
    GREATER_OR_EQUAL = "GREATER_OR_EQUAL",
    LESS_THAN        = "LESS_THAN",
    LESS_OR_EQUAL    = "LESS_OR_EQUAL",
    BETWEEN          = "BETWEEN",
    IS_NULL          = "IS_NULL",
    IS_NOT_NULL      = "IS_NOT_NULL",
    /* eslint-enable prettier/prettier */
}

registerEnumType(PublicOrdinalOperator, { name: "PublicOrdinalOperator" });
registerEnumType(PublicStringOperator, { name: "PublicStringOperator" });
registerEnumType(PublicLinkOperator, { name: "PublicLinkOperator" });
registerEnumType(QueryOrder, { name: "QueryOrder" });
