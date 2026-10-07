import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { isUUID } from "class-validator";

import { Project } from "./project.entity";

describe("Project lifecycle", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it("generates identity and metadata even when extra input contains them", () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
        const props = {
            profile: "00000000-0000-4000-8000-000000000001",
            name: "Before",
            url: "https://example.com",
            id: "00000000-0000-4000-8000-000000000099",
            createdAt: new Date("2020-01-01"),
            updatedAt: new Date("2021-01-01"),
        };
        const first = new Project(props);
        const second = new Project(props);
        expect(isUUID(first.id, "4")).toBe(true);
        expect(first.id).not.toBe(props.id);
        expect(first.id).not.toBe(second.id);
        expect(first.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
        expect(first.updatedAt).toBeNull();
    });
});
