import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";

import { ErrorCode } from "~common/exceptions";
import { graphqlSuite } from "~testing/integration/containers/graphql.suite";

describe("ExperienceResolver", () => {
    const suite = graphqlSuite();

    it("exposes a connection and resolves a record by id", async () => {
        const row = await suite.prisma().experience.findFirstOrThrow();
        const result = await suite.application().query(`{
            experience(id: "${row.id}") { id owner { id } }
            experiences(first: 1) { edges { cursor node { id owner { id } } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } }
        }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.experience).toEqual({ id: row.id, owner: { id: row.profile } });
        expect(result.data?.experiences?.edges).toEqual([
            expect.objectContaining({
                node: expect.objectContaining({ owner: { id: row.profile } }),
            }),
        ]);
        expect(result.data?.experiences?.edges).toHaveLength(1);
    });

    it("validates page bounds, identifiers and nested predicates", async () => {
        expect(
            (await suite.application().query("{ experiences(first: 101) { edges { node { id } } } }")).errors?.[0]
                ?.extensions.code,
        ).toBe(ErrorCode.BAD_REQUEST);
        expect((await suite.application().query('{ experience(id: "invalid") { id } }')).errors?.[0]?.extensions.code).toBe(
            ErrorCode.BAD_REQUEST,
        );
        const result = await suite
            .application()
            .query('{ experiences(filter: { id: { predicate: EQUAL, value: "invalid" } }) { edges { node { id } } } }');
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("returns null for a missing record", async () => {
        await suite.prisma().profile.deleteMany();
        expect(await suite.application().query(`{ experience(id: "${suite.profile()}") { id } }`)).toEqual({
            data: { experience: null },
        });
    });

    it("accepts DateTime filters and rejects invalid ranges and null predicates", async () => {
        const result = await suite.application().query(`{
            experiences(filter: {
                startDate: { predicate: BETWEEN, value: ["2023-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z"] }
                endDate: { predicate: IS_NULL, value: [] }
            }) { edges { node { startDate } } }
        }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.experiences?.edges).toEqual([{ node: { startDate: "2023-06-01T00:00:00.000Z" } }]);
        await Promise.all(
            [
                "createdAt: { predicate: IS_NULL, value: [] }",
                'endDate: { predicate: IS_NULL, value: ["2024-01-01T00:00:00.000Z"] }',
                'startDate: { predicate: BETWEEN, value: ["2025-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z"] }',
                'startDate: { predicate: BETWEEN, value: ["2024-01-01T00:00:00.000Z"] }',
                'startDate: { predicate: EQUAL, value: ["invalid"] }',
            ].map(async (filter) => {
                const invalid = await suite
                    .application()
                    .query(`{ experiences(filter: { ${filter} }) { edges { node { id } } } }`);
                expect(invalid.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
            }),
        );
    });

    it("returns success messages from commands and retrieves data through queries", async () => {
        const input = {
            profile: suite.profile(),
            company: "Created",
            position: "Developer",
            achievements: "Done",
            startDate: "2024-01-01T00:00:00.000Z",
            endDate: "2025-01-01T00:00:00.000Z",
        };
        const create = "mutation($input: ExperienceCreateInput!) { createExperience(input: $input) { message } }";
        const created = await suite.application().query(create, { input });
        expect(created).toEqual({ data: { createExperience: { message: "Experience created successfully" } } });
        const stored = await suite.prisma().experience.findFirstOrThrow({ where: { company: "Created" } });
        const entity = { ...input, id: stored.id, createdAt: stored.createdAt.toISOString(), updatedAt: null };
        const read = await suite
            .application()
            .query(
                `{ experience(id: "${stored.id}") { id createdAt updatedAt company position achievements startDate endDate profile } }`,
            );
        expect(read).toEqual({ data: { experience: entity } });
        const updated = await suite
            .application()
            .query("mutation($input: ExperienceUpdateInput!) { updateExperience(input: $input) { message } }", {
                input: { id: stored.id, patch: { company: "Updated" } },
            });
        expect(updated).toEqual({ data: { updateExperience: { message: "Experience updated successfully" } } });
        const after = await suite
            .application()
            .query(
                `{ experience(id: "${stored.id}") { id createdAt updatedAt company position achievements startDate endDate profile } }`,
            );
        expect(after.errors).toBeUndefined();
        expect(after.data?.experience).toEqual({ ...entity, company: "Updated", updatedAt: entity.updatedAt });
        const second = await suite.application().query(create, { input: { ...input, company: "Second" } });
        expect(second).toEqual({ data: { createExperience: { message: "Experience created successfully" } } });
        const other = await suite.prisma().experience.findFirstOrThrow({ where: { company: "Second" } });
        const identifiers = [stored.id, other.id];
        const purged = await suite
            .application()
            .query("mutation($input: ExperiencePurgeInput!) { purgeExperience(input: $input) { message } }", {
                input: { identifiers },
            });
        expect(purged).toEqual({ data: { purgeExperience: { message: "Experiences purged successfully" } } });
        expect(await suite.prisma().experience.count({ where: { id: { in: identifiers } } })).toBe(0);
    });

    it("validates DTO input, accepts unchanged patches and reports missing records", async () => {
        const count = await suite.prisma().experience.count();
        const input = {
            profile: suite.profile(),
            company: "Created",
            position: "Developer",
            achievements: "Done",
            startDate: "2024-01-01T00:00:00.000Z",
            endDate: "2025-01-01T00:00:00.000Z",
        };
        const invalid = await suite
            .application()
            .query("mutation($input: ExperienceCreateInput!) { createExperience(input: $input) { message } }", {
                input: { ...input, ...{ profile: suite.profile(), company: "" } },
            });
        expect(invalid.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
        expect(await suite.prisma().experience.count()).toBe(count);
        const created = await suite
            .application()
            .query<Integration.GraphQL.Mutation>(
                "mutation($input: ExperienceCreateInput!) { createExperience(input: $input) { message } }",
                { input },
            );
        expect(created.errors).toBeUndefined();
        const { id } = await suite.prisma().experience.findFirstOrThrow({ where: { company: "Created" } });
        const stored = await suite.prisma().experience.findUniqueOrThrow({ where: { id } });
        await Promise.all(
            (
                [
                    [{ company: null }, ErrorCode.BAD_REQUEST],
                    [{ company: "" }, ErrorCode.BAD_REQUEST],
                ] as const
            ).map(async ([patch, code]) => {
                const result = await suite
                    .application()
                    .query("mutation($input: ExperienceUpdateInput!) { updateExperience(input: $input) { message } }", {
                        input: { id, patch },
                    });
                expect(result.errors?.[0]?.extensions.code).toBe(code);
                expect(await suite.prisma().experience.findUniqueOrThrow({ where: { id } })).toEqual(stored);
            }),
        );
        const unchanged = async (patch: Services.Experience.Update.Props["patch"]): Promise<void> => {
            const result = await suite
                .application()
                .query("mutation($input: ExperienceUpdateInput!) { updateExperience(input: $input) { message } }", {
                    input: { id, patch },
                });
            expect(result).toEqual({ data: { updateExperience: { message: "Experience updated successfully" } } });
            expect(await suite.prisma().experience.findUniqueOrThrow({ where: { id } })).toEqual(stored);
        };
        await unchanged({});
        await unchanged({ company: "Created" });
        const missing = await suite
            .application()
            .query("mutation($input: ExperienceUpdateInput!) { updateExperience(input: $input) { message } }", {
                input: { id: randomUUID(), patch: { company: "Changed" } },
            });
        expect(missing.errors?.[0]?.extensions.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("validates bulk identifiers and rolls back when any target is missing", async () => {
        const row = await suite.prisma().experience.findFirstOrThrow();
        const count = await suite.prisma().experience.count();
        const mutation = "mutation($input: ExperiencePurgeInput!) { purgeExperience(input: $input) { message } }";
        await Promise.all(
            [[], [row.id, row.id], ["invalid"], Array.from({ length: 101 }, () => randomUUID())].map(
                async (identifiers) => {
                    const result = await suite.application().query(mutation, { input: { identifiers } });
                    expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
                },
            ),
        );
        const missing = await suite.application().query(mutation, { input: { identifiers: [row.id, randomUUID()] } });
        expect(missing.errors?.[0]?.extensions.code).toBe(ErrorCode.NOT_FOUND);
        expect(await suite.prisma().experience.count()).toBe(count);
        expect(await suite.prisma().experience.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
    });

    it("rejects a missing parent without creating a record", async () => {
        const input = {
            profile: suite.profile(),
            company: "Created",
            position: "Developer",
            achievements: "Done",
            startDate: "2024-01-01T00:00:00.000Z",
            endDate: "2025-01-01T00:00:00.000Z",
        };
        const count = await suite.prisma().experience.count();
        const result = await suite
            .application()
            .query("mutation($input: ExperienceCreateInput!) { createExperience(input: $input) { message } }", {
                input: { ...input, profile: randomUUID() },
            });
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.NOT_FOUND);
        expect(await suite.prisma().experience.count()).toBe(count);
    });

    it("clears endDate with null and preserves it when the field is omitted", async () => {
        const row = await suite.prisma().experience.findFirstOrThrow();
        const mutation = "mutation($input: ExperienceUpdateInput!) { updateExperience(input: $input) { message } }";
        const dated = await suite.application().query(mutation, {
            input: { id: row.id, patch: { endDate: "2025-01-01T00:00:00.000Z" } },
        });
        expect(dated.errors).toBeUndefined();
        const unchanged = await suite
            .application()
            .query(mutation, { input: { id: row.id, patch: { achievements: "Changed" } } });
        expect(unchanged.errors).toBeUndefined();
        expect(unchanged.data?.updateExperience).toEqual({ message: "Experience updated successfully" });
        expect((await suite.prisma().experience.findUniqueOrThrow({ where: { id: row.id } })).endDate).toEqual(
            new Date("2025-01-01T00:00:00.000Z"),
        );
        const cleared = await suite.application().query(mutation, { input: { id: row.id, patch: { endDate: null } } });
        expect(cleared.errors).toBeUndefined();
        expect(cleared.data?.updateExperience).toEqual({ message: "Experience updated successfully" });
        const read = await suite.application().query(`{ experience(id: "${row.id}") { id endDate achievements } }`);
        expect(read).toEqual({ data: { experience: { id: row.id, endDate: null, achievements: "Changed" } } });
        expect((await suite.prisma().experience.findUniqueOrThrow({ where: { id: row.id } })).endDate).toBeNull();
    });

    it("returns a conflict for an inverted period and keeps stored data intact", async () => {
        const row = await suite.prisma().experience.findFirstOrThrow();
        const result = await suite
            .application()
            .query("mutation($input: ExperienceUpdateInput!) { updateExperience(input: $input) { message } }", {
                input: { id: row.id, patch: { endDate: "2000-01-01T00:00:00.000Z" } },
            });
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.CONFLICT);
        expect(await suite.prisma().experience.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
    });
});
