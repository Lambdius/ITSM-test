import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";

import { ErrorCode } from "~common/exceptions";
import { graphqlSuite } from "~testing/integration/containers/graphql.suite";

describe("SkillResolver", () => {
    const suite = graphqlSuite();

    it("exposes a connection and resolves a record by id", async () => {
        const row = await suite.prisma().profileSkill.findFirstOrThrow();
        const result = await suite.application().query(`{
            skill(id: "${row.id}") { id owner { id } }
            skills(first: 1) { edges { cursor node { id owner { id } } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } }
        }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.skill).toEqual({ id: row.id, owner: { id: row.profile } });
        expect(result.data?.skills?.edges).toEqual([
            expect.objectContaining({
                node: expect.objectContaining({ owner: { id: row.profile } }),
            }),
        ]);
        expect(result.data?.skills?.edges).toHaveLength(1);
    });

    it("validates page bounds, identifiers and nested predicates", async () => {
        expect(
            (await suite.application().query("{ skills(first: 101) { edges { node { id } } } }")).errors?.[0]?.extensions
                .code,
        ).toBe(ErrorCode.BAD_REQUEST);
        expect((await suite.application().query('{ skill(id: "invalid") { id } }')).errors?.[0]?.extensions.code).toBe(
            ErrorCode.BAD_REQUEST,
        );
        const result = await suite
            .application()
            .query('{ skills(filter: { id: { predicate: EQUAL, value: "invalid" } }) { edges { node { id } } } }');
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("returns null for a missing record", async () => {
        await suite.prisma().profile.deleteMany();
        expect(await suite.application().query(`{ skill(id: "${suite.profile()}") { id } }`)).toEqual({
            data: { skill: null },
        });
    });

    it("passes returned cursors and supports scalar/list predicate values", async () => {
        const first = await suite.application().query<Integration.GraphQL.Lists>(`{
            skills(first: 1, filter: { name: { predicate: IN, value: ["TypeScript", "JavaScript"] } }) {
                edges { node { name } }
                pageInfo { hasNextPage endCursor }
            }
        }`);
        expect(first.errors).toBeUndefined();
        expect(first.data?.skills?.pageInfo.hasNextPage).toBe(true);
        const second = await suite.application().query<Integration.GraphQL.Lists>(
            `query($after: String) {
            skills(first: 1, after: $after, filter: { name: { predicate: IN, value: ["TypeScript", "JavaScript"] } }) {
                edges { node { name } }
                pageInfo { hasNextPage endCursor }
            }
        }`,
            { after: first.data?.skills?.pageInfo.endCursor },
        );
        expect(second.errors).toBeUndefined();
        const edges = [...(first.data?.skills?.edges ?? []), ...(second.data?.skills?.edges ?? [])];
        expect(edges).toHaveLength(2);
        expect(edges).toEqual(expect.arrayContaining([{ node: { name: "JavaScript" } }, { node: { name: "TypeScript" } }]));
        expect(second.data?.skills?.pageInfo.hasNextPage).toBe(false);
    });

    it("validates string length, value count and duplicate sort fields", async () => {
        const invalid = await suite.application().query(
            `query($value: [String!]!) {
            skills(filter: { name: { predicate: EQUAL, value: $value } }) { edges { node { id } } }
        }`,
            { value: ["x".repeat(101)] },
        );
        expect(invalid.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
        const multiple = await suite
            .application()
            .query('{ skills(filter: { name: { predicate: EQUAL, value: ["a", "b"] } }) { edges { node { id } } } }');
        expect(multiple.errors?.[0]?.extensions).toMatchObject({
            code: ErrorCode.BAD_REQUEST,
            details: [{ path: "filter.name.value", messages: ["EQUAL requires exactly one value"] }],
        });
        const order = await suite
            .application()
            .query(
                "{ skills(orderBy: [{field: CREATED_AT, direction: ASC}, {field: CREATED_AT, direction: DESC}]) { edges {node {id}} } }",
            );
        expect(order.errors?.[0]?.extensions).toMatchObject({
            code: ErrorCode.BAD_REQUEST,
            details: [
                {
                    path: "orderBy",
                    messages: expect.arrayContaining([
                        "All orderBy's elements must be unique",
                        "orderBy must contain no more than 1 elements",
                    ]),
                },
            ],
        });
    });

    it.each(["", "null", "[]", "{}", "true"])("rejects malformed cursor %s with BAD_REQUEST", async (value) => {
        const result = await suite
            .application()
            .query("query($after: String) { skills(after: $after) { edges { node { id } } } }", {
                after: Buffer.from(value).toString("base64url"),
            });
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("returns success messages from commands and retrieves data through queries", async () => {
        const input = { profile: suite.profile(), name: "Created" };
        const create = "mutation($input: SkillCreateInput!) { createSkill(input: $input) { message } }";
        const created = await suite.application().query(create, { input });
        expect(created).toEqual({ data: { createSkill: { message: "Skill created successfully" } } });
        const stored = await suite.prisma().profileSkill.findFirstOrThrow({ where: { name: "Created" } });
        const entity = { ...input, id: stored.id, createdAt: stored.createdAt.toISOString(), updatedAt: null };
        const read = await suite
            .application()
            .query(`{ skill(id: "${stored.id}") { id createdAt updatedAt name profile } }`);
        expect(read).toEqual({ data: { skill: entity } });
        const updated = await suite
            .application()
            .query("mutation($input: SkillUpdateInput!) { updateSkill(input: $input) { message } }", {
                input: { id: stored.id, patch: { name: "Updated" } },
            });
        expect(updated).toEqual({ data: { updateSkill: { message: "Skill updated successfully" } } });
        const after = await suite
            .application()
            .query(`{ skill(id: "${stored.id}") { id createdAt updatedAt name profile } }`);
        expect(after.errors).toBeUndefined();
        expect(after.data?.skill).toEqual({ ...entity, name: "Updated", updatedAt: entity.updatedAt });
        const second = await suite.application().query(create, { input: { ...input, name: "Second" } });
        expect(second).toEqual({ data: { createSkill: { message: "Skill created successfully" } } });
        const other = await suite.prisma().profileSkill.findFirstOrThrow({ where: { name: "Second" } });
        const identifiers = [stored.id, other.id];
        const purged = await suite
            .application()
            .query("mutation($input: SkillPurgeInput!) { purgeSkill(input: $input) { message } }", {
                input: { identifiers },
            });
        expect(purged).toEqual({ data: { purgeSkill: { message: "Skills purged successfully" } } });
        expect(await suite.prisma().profileSkill.count({ where: { id: { in: identifiers } } })).toBe(0);
    });

    it("validates DTO input, accepts unchanged patches and reports missing records", async () => {
        const count = await suite.prisma().profileSkill.count();
        const input = { profile: suite.profile(), name: "Created" };
        const invalid = await suite
            .application()
            .query("mutation($input: SkillCreateInput!) { createSkill(input: $input) { message } }", {
                input: { ...input, ...{ profile: suite.profile(), name: "" } },
            });
        expect(invalid.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
        expect(await suite.prisma().profileSkill.count()).toBe(count);
        const created = await suite
            .application()
            .query<Integration.GraphQL.Mutation>(
                "mutation($input: SkillCreateInput!) { createSkill(input: $input) { message } }",
                { input },
            );
        expect(created.errors).toBeUndefined();
        const { id } = await suite.prisma().profileSkill.findFirstOrThrow({ where: { name: "Created" } });
        const stored = await suite.prisma().profileSkill.findUniqueOrThrow({ where: { id } });
        await Promise.all(
            (
                [
                    [{ name: null }, ErrorCode.BAD_REQUEST],
                    [{ name: "" }, ErrorCode.BAD_REQUEST],
                ] as const
            ).map(async ([patch, code]) => {
                const result = await suite
                    .application()
                    .query("mutation($input: SkillUpdateInput!) { updateSkill(input: $input) { message } }", {
                        input: { id, patch },
                    });
                expect(result.errors?.[0]?.extensions.code).toBe(code);
                expect(await suite.prisma().profileSkill.findUniqueOrThrow({ where: { id } })).toEqual(stored);
            }),
        );
        const unchanged = async (patch: Services.Skill.Update.Props["patch"]): Promise<void> => {
            const result = await suite
                .application()
                .query("mutation($input: SkillUpdateInput!) { updateSkill(input: $input) { message } }", {
                    input: { id, patch },
                });
            expect(result).toEqual({ data: { updateSkill: { message: "Skill updated successfully" } } });
            expect(await suite.prisma().profileSkill.findUniqueOrThrow({ where: { id } })).toEqual(stored);
        };
        await unchanged({});
        await unchanged({ name: "Created" });
        const missing = await suite
            .application()
            .query("mutation($input: SkillUpdateInput!) { updateSkill(input: $input) { message } }", {
                input: { id: randomUUID(), patch: { name: "Changed" } },
            });
        expect(missing.errors?.[0]?.extensions.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("validates bulk identifiers and rolls back when any target is missing", async () => {
        const row = await suite.prisma().profileSkill.findFirstOrThrow();
        const count = await suite.prisma().profileSkill.count();
        const mutation = "mutation($input: SkillPurgeInput!) { purgeSkill(input: $input) { message } }";
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
        expect(await suite.prisma().profileSkill.count()).toBe(count);
        expect(await suite.prisma().profileSkill.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
    });

    it("rejects a missing parent without creating a record", async () => {
        const input = { profile: suite.profile(), name: "Created" };
        const count = await suite.prisma().profileSkill.count();
        const result = await suite
            .application()
            .query("mutation($input: SkillCreateInput!) { createSkill(input: $input) { message } }", {
                input: { ...input, profile: randomUUID() },
            });
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.NOT_FOUND);
        expect(await suite.prisma().profileSkill.count()).toBe(count);
    });

    it("maps duplicate skills to a conflict and rolls back failed updates", async () => {
        const row = await suite.prisma().profileSkill.findFirstOrThrow({ where: { name: "TypeScript" } });
        const created = await suite
            .application()
            .query("mutation($input: SkillCreateInput!) { createSkill(input: $input) { message } }", {
                input: { profile: suite.profile(), name: row.name },
            });
        expect(created.errors?.[0]?.extensions.code).toBe(ErrorCode.CONFLICT);
        const updated = await suite
            .application()
            .query("mutation($input: SkillUpdateInput!) { updateSkill(input: $input) { message } }", {
                input: { id: row.id, patch: { name: "JavaScript" } },
            });
        expect(updated.errors?.[0]?.extensions.code).toBe(ErrorCode.CONFLICT);
        expect(await suite.prisma().profileSkill.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
    });
});
