import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { isUUID } from "class-validator";

import { ErrorCode } from "~common/exceptions";

import { Profile } from "./profile.entity";

describe("Profile lifecycle", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it("generates identity and metadata even when extra input contains them", () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
        const props = {
            name: "Before",
            description: "",
            links: [],
            id: "00000000-0000-4000-8000-000000000099",
            createdAt: new Date("2020-01-01"),
            updatedAt: new Date("2021-01-01"),
            isRevoked: true,
        };
        const first = new Profile(props);
        const second = new Profile(props);
        expect(isUUID(first.id, "4")).toBe(true);
        expect(first.id).not.toBe(props.id);
        expect(first.id).not.toBe(second.id);
        expect(first.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
        expect(first.updatedAt).toBeNull();
        expect(first.isRevoked).toBe(false);
    });

    it("creates immutable link values without freezing constructor input", () => {
        const links = [{ label: "Site", url: "https://example.com" }];
        const entity = new Profile({ name: "Profile", description: "", links });
        expect(entity.links).toEqual(links);
        expect(Object.isFrozen(entity.links[0])).toBe(true);
        expect(Object.isFrozen(links[0])).toBe(false);
    });

    it.each([false, true])("checks purge eligibility for isRevoked=%s without mutating the entity", (isRevoked) => {
        const entity = new Profile({ name: "Profile", description: "", links: [] });
        entity.isRevoked = isRevoked;
        const before = { ...entity };
        if (isRevoked) {
            expect(() => entity.canPurge()).not.toThrow();
        } else {
            expect(() => entity.canPurge()).toThrow(
                expect.objectContaining({
                    code: ErrorCode.INVARIANT_VIOLATION,
                    message: "Cannot purge an active profile",
                }),
            );
        }
        expect({ ...entity }).toEqual(before);
    });
});
