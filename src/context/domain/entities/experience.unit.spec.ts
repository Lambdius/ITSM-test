import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { isUUID } from "class-validator";

import { Experience } from "./experience.entity";

describe("Experience lifecycle", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it("generates identity and metadata even when extra input contains them", () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
        const props = {
            profile: "00000000-0000-4000-8000-000000000001",
            company: "Before",
            position: "Developer",
            achievements: "Text",
            startDate: new Date("2024-01-01"),
            endDate: null,
            id: "00000000-0000-4000-8000-000000000099",
            createdAt: new Date("2020-01-01"),
            updatedAt: new Date("2021-01-01"),
        };
        const first = new Experience(props);
        const second = new Experience(props);
        expect(isUUID(first.id, "4")).toBe(true);
        expect(first.id).not.toBe(props.id);
        expect(first.id).not.toBe(second.id);
        expect(first.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
        expect(first.updatedAt).toBeNull();
    });

    it("preserves Date values passed to the constructor", () => {
        const startDate = new Date("2024-01-01T13:45:12.345Z");
        const endDate = new Date("2025-02-03T16:30:00.123Z");
        const entity = new Experience({
            profile: "00000000-0000-4000-8000-000000000001",
            company: "Acme",
            position: "Developer",
            achievements: "",
            startDate,
            endDate,
        });
        expect(entity.startDate).toBe(startDate);
        expect(entity.endDate).toBe(endDate);
    });
});
