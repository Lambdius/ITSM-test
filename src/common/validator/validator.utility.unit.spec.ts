import { describe, expect, it } from "@jest/globals";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { ExperienceUpdateArgsDTO } from "~context/interface/dto/experience";
import { ProjectCreateArgsDTO } from "~context/interface/dto/project";
import { ProfilePurgeArgsDTO } from "~context/interface/dto/profile";
import { ConnectionArgsDTO } from "~common/dto";

const id = "00000000-0000-4000-8000-000000000001";

function accepts<T extends object>(DTO: new () => T, data: object): boolean {
    return validateSync(plainToInstance(DTO, data), { whitelist: true, forbidNonWhitelisted: true }).length === 0;
}

describe("Validator combinations", () => {
    it("validates positive integer page sizes without coercing GraphQL inputs", () => {
        expect(accepts(ConnectionArgsDTO, { first: 1 })).toBe(true);
        for (const first of [0, -1, 1.5, "1", 101]) {
            expect(accepts(ConnectionArgsDTO, { first })).toBe(false);
        }
    });

    it("distinguishes omitted patch fields from explicit null", () => {
        expect(accepts(ExperienceUpdateArgsDTO, { id, patch: {} })).toBe(true);
        expect(accepts(ExperienceUpdateArgsDTO, { id, patch: { company: null } })).toBe(false);
        expect(accepts(ExperienceUpdateArgsDTO, { id, patch: { startDate: null } })).toBe(false);
        expect(accepts(ExperienceUpdateArgsDTO, { id, patch: { endDate: null } })).toBe(true);
        expect(accepts(ExperienceUpdateArgsDTO, { id, patch: { endDate: new Date() } })).toBe(true);
        expect(accepts(ExperienceUpdateArgsDTO, { id, patch: { company: "" } })).toBe(false);
    });

    it("requires bounded unique UUID lists for bulk commands", () => {
        expect(accepts(ProfilePurgeArgsDTO, { identifiers: [id] })).toBe(true);
        for (const identifiers of [[], [id, id], ["invalid"], [null], id]) {
            expect(accepts(ProfilePurgeArgsDTO, { identifiers })).toBe(false);
        }
    });

    it("checks the protocol and length of HTTP links and bounds non-empty names", () => {
        const input = { name: "Project", url: "https://example.com", profile: id };
        expect(accepts(ProjectCreateArgsDTO, input)).toBe(true);
        for (const url of ["ftp://example.com", "example.com", `https://example.com/${"a".repeat(2048)}`]) {
            expect(accepts(ProjectCreateArgsDTO, { ...input, url })).toBe(false);
        }
        expect(accepts(ProjectCreateArgsDTO, { ...input, name: "" })).toBe(false);
        expect(accepts(ProjectCreateArgsDTO, { ...input, name: "a".repeat(101) })).toBe(false);
    });
});
