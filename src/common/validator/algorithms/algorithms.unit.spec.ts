import { describe, expect, it } from "@jest/globals";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { ExperienceListArgsDTO } from "~context/interface/dto/experience/req/get-list.dto";
import { SkillListArgsDTO } from "~context/interface/dto/skill/req/get-list.dto";
import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

const id = "00000000-0000-4000-8000-000000000001";
const date = "2026-01-01T00:00:00.000Z";
const cursor = { version: 1, scope: "a".repeat(64), values: [date, id] };

function accepts<T extends object>(DTO: new () => T, data: object): boolean {
    return validateSync(plainToInstance(DTO, data), { whitelist: true, forbidNonWhitelisted: true }).length === 0;
}

function encode(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
}

describe("IsCursor", () => {
    it("accepts absent cursors and positions matching default or explicit date sorts", () => {
        expect(accepts(SkillListArgsDTO, {})).toBe(true);
        expect(accepts(SkillListArgsDTO, { after: null })).toBe(true);
        expect(accepts(SkillListArgsDTO, { after: encode(cursor) })).toBe(true);
        expect(
            accepts(ExperienceListArgsDTO, {
                after: encode({ ...cursor, values: [date, date, id] }),
                orderBy: [
                    { field: "startDate", direction: "desc" },
                    { field: "createdAt", direction: "asc" },
                ],
            }),
        ).toBe(true);
    });

    it.each(["", "!", "a".repeat(4097), 42, encode("text"), encode(null), encode([]), encode(true)])(
        "rejects malformed or non-object cursor %#",
        (after) => {
            expect(accepts(SkillListArgsDTO, { after })).toBe(false);
        },
    );

    it.each([
        {},
        { ...cursor, version: 2 },
        { ...cursor, scope: "invalid" },
        { ...cursor, extra: true },
        { ...cursor, values: [] },
        { ...cursor, values: [date] },
        { ...cursor, values: [date, date, id] },
        { ...cursor, values: ["2026-02-30T00:00:00.000Z", id] },
        { ...cursor, values: [date, "invalid"] },
        { ...cursor, values: [id, date] },
        { ...cursor, values: [null, id] },
    ])("rejects invalid decoded cursor %#", (payload) => {
        expect(accepts(SkillListArgsDTO, { after: encode(payload) })).toBe(false);
    });

    it("rejects positions inconsistent with the number of requested sort fields", () => {
        expect(
            accepts(ExperienceListArgsDTO, {
                after: encode(cursor),
                orderBy: [
                    { field: "startDate", direction: "desc" },
                    { field: "createdAt", direction: "asc" },
                ],
            }),
        ).toBe(false);
        expect(accepts(SkillListArgsDTO, { after: encode(cursor), orderBy: {} })).toBe(false);
    });
});

describe("IsFilterValue", () => {
    it.each([
        { predicate: "EQUAL", value: ["a"], valid: true },
        { predicate: "NOT_EQUAL", value: ["a"], valid: true },
        { predicate: "ILIKE", value: ["a"], valid: true },
        { predicate: "EQUAL", value: ["a", "b"], valid: false },
        { predicate: "EQUAL", value: [], valid: false },
        { predicate: "EQUAL", value: "a", valid: false },
        { predicate: "IN", value: ["a", "b"], valid: true },
        { predicate: "NOT_IN", value: Array(100).fill("a"), valid: true },
        { predicate: "IN", value: Array(101).fill("a"), valid: false },
        { predicate: "IN", value: [], valid: false },
        { predicate: "IN", value: [42], valid: false },
        { predicate: "EQUAL", value: ["a".repeat(101)], valid: false },
        { predicate: "UNKNOWN", value: ["a"], valid: false },
    ])("validates string predicate and values %#", ({ predicate, value, valid }) => {
        expect(accepts(StringFilterDTO, { predicate, value })).toBe(valid);
    });

    it.each([
        { predicate: "BETWEEN", value: [new Date(date), new Date(date)], valid: true },
        { predicate: "BETWEEN", value: [new Date(date), new Date("2025-01-01")], valid: false },
        { predicate: "BETWEEN", value: [new Date(date)], valid: false },
        { predicate: "BETWEEN", value: [new Date("invalid"), new Date(date)], valid: false },
        { predicate: "GREATER_THAN", value: [new Date(date)], valid: true },
        { predicate: "GREATER_THAN", value: [date], valid: false },
        { predicate: "IS_NULL", value: [], valid: true },
        { predicate: "IS_NOT_NULL", value: [], valid: true },
        { predicate: "IS_NULL", value: [new Date(date)], valid: false },
        { predicate: "EQUAL", value: null, valid: false },
    ])("validates date predicate and values %#", ({ predicate, value, valid }) => {
        expect(accepts(OrdinalFilterDTO, { predicate, value })).toBe(valid);
    });

    it("retains UUID validation and nullability restrictions", () => {
        expect(accepts(LinkFilterDTO, { predicate: "EQUAL", value: [id] })).toBe(true);
        expect(accepts(LinkFilterDTO, { predicate: "IN", value: ["invalid"] })).toBe(false);
        expect(accepts(ExperienceListArgsDTO, { filter: { createdAt: { predicate: "IS_NULL", value: [] } } })).toBe(false);
        expect(accepts(ExperienceListArgsDTO, { filter: { endDate: { predicate: "IS_NULL", value: [] } } })).toBe(true);
    });
});
