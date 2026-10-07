import { describe, expect, it } from "@jest/globals";

import { ProfessionalLink } from "./professional-link";

describe("ProfessionalLink", () => {
    it("keeps a immutable without an identity", () => {
        const props = { label: "GitHub", url: "https://github.com/example" };
        const link = new ProfessionalLink(props);
        expect(link).toEqual(props);
        expect(link).not.toHaveProperty("id");
        expect(Object.isFrozen(link)).toBe(true);
        expect(Reflect.set(link, "url", "https://example.com")).toBe(false);
        expect(link.url).toBe(props.url);
        expect(new ProfessionalLink(props)).toEqual(link);
    });
});
