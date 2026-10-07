import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";

import { ErrorCode } from "~common/exceptions";
import { graphqlSuite } from "~testing/integration/containers/graphql.suite";

describe("ProjectResolver", () => {
    const suite = graphqlSuite();

    it("exposes a connection and resolves a record by id", async () => {
        const row = await suite.prisma().project.findFirstOrThrow();
        const result = await suite.application().query(`{
            project(id: "${row.id}") { id owner { id } }
            projects(first: 1) { edges { cursor node { id owner { id } } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } }
        }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.project).toEqual({ id: row.id, owner: { id: row.profile } });
        expect(result.data?.projects?.edges).toEqual([
            expect.objectContaining({
                node: expect.objectContaining({ owner: { id: row.profile } }),
            }),
        ]);
        expect(result.data?.projects?.edges).toHaveLength(1);
    });

    it("validates page bounds, identifiers and nested predicates", async () => {
        expect(
            (await suite.application().query("{ projects(first: 101) { edges { node { id } } } }")).errors?.[0]?.extensions
                .code,
        ).toBe(ErrorCode.BAD_REQUEST);
        expect((await suite.application().query('{ project(id: "invalid") { id } }')).errors?.[0]?.extensions.code).toBe(
            ErrorCode.BAD_REQUEST,
        );
        const result = await suite
            .application()
            .query('{ projects(filter: { id: { predicate: EQUAL, value: "invalid" } }) { edges { node { id } } } }');
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("returns null for a missing record", async () => {
        await suite.prisma().profile.deleteMany();
        expect(await suite.application().query(`{ project(id: "${suite.profile()}") { id } }`)).toEqual({
            data: { project: null },
        });
    });

    it("returns success messages from commands and retrieves data through queries", async () => {
        const input = { profile: suite.profile(), name: "Created", url: "https://example.com" };
        const create = "mutation($input: ProjectCreateInput!) { createProject(input: $input) { message } }";
        const created = await suite.application().query(create, { input });
        expect(created).toEqual({ data: { createProject: { message: "Project created successfully" } } });
        const stored = await suite.prisma().project.findFirstOrThrow({ where: { name: "Created" } });
        const entity = { ...input, id: stored.id, createdAt: stored.createdAt.toISOString(), updatedAt: null };
        const read = await suite
            .application()
            .query(`{ project(id: "${stored.id}") { id createdAt updatedAt name url profile } }`);
        expect(read).toEqual({ data: { project: entity } });
        const updated = await suite
            .application()
            .query("mutation($input: ProjectUpdateInput!) { updateProject(input: $input) { message } }", {
                input: { id: stored.id, patch: { name: "Updated" } },
            });
        expect(updated).toEqual({ data: { updateProject: { message: "Project updated successfully" } } });
        const after = await suite
            .application()
            .query(`{ project(id: "${stored.id}") { id createdAt updatedAt name url profile } }`);
        expect(after.errors).toBeUndefined();
        expect(after.data?.project).toEqual({ ...entity, name: "Updated", updatedAt: entity.updatedAt });
        const second = await suite.application().query(create, { input: { ...input, name: "Second" } });
        expect(second).toEqual({ data: { createProject: { message: "Project created successfully" } } });
        const other = await suite.prisma().project.findFirstOrThrow({ where: { name: "Second" } });
        const identifiers = [stored.id, other.id];
        const purged = await suite
            .application()
            .query("mutation($input: ProjectPurgeInput!) { purgeProject(input: $input) { message } }", {
                input: { identifiers },
            });
        expect(purged).toEqual({ data: { purgeProject: { message: "Projects purged successfully" } } });
        expect(await suite.prisma().project.count({ where: { id: { in: identifiers } } })).toBe(0);
    });

    it("validates DTO input, accepts unchanged patches and reports missing records", async () => {
        const count = await suite.prisma().project.count();
        const input = { profile: suite.profile(), name: "Created", url: "https://example.com" };
        const invalid = await suite
            .application()
            .query("mutation($input: ProjectCreateInput!) { createProject(input: $input) { message } }", {
                input: { ...input, ...{ profile: suite.profile(), name: "" } },
            });
        expect(invalid.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
        expect(await suite.prisma().project.count()).toBe(count);
        const created = await suite
            .application()
            .query<Integration.GraphQL.Mutation>(
                "mutation($input: ProjectCreateInput!) { createProject(input: $input) { message } }",
                { input },
            );
        expect(created.errors).toBeUndefined();
        const { id } = await suite.prisma().project.findFirstOrThrow({ where: { name: "Created" } });
        const stored = await suite.prisma().project.findUniqueOrThrow({ where: { id } });
        await Promise.all(
            (
                [
                    [{ name: null }, ErrorCode.BAD_REQUEST],
                    [{ name: "" }, ErrorCode.BAD_REQUEST],
                ] as const
            ).map(async ([patch, code]) => {
                const result = await suite
                    .application()
                    .query("mutation($input: ProjectUpdateInput!) { updateProject(input: $input) { message } }", {
                        input: { id, patch },
                    });
                expect(result.errors?.[0]?.extensions.code).toBe(code);
                expect(await suite.prisma().project.findUniqueOrThrow({ where: { id } })).toEqual(stored);
            }),
        );
        const unchanged = async (patch: Services.Project.Update.Props["patch"]): Promise<void> => {
            const result = await suite
                .application()
                .query("mutation($input: ProjectUpdateInput!) { updateProject(input: $input) { message } }", {
                    input: { id, patch },
                });
            expect(result).toEqual({ data: { updateProject: { message: "Project updated successfully" } } });
            expect(await suite.prisma().project.findUniqueOrThrow({ where: { id } })).toEqual(stored);
        };
        await unchanged({});
        await unchanged({ name: "Created" });
        const missing = await suite
            .application()
            .query("mutation($input: ProjectUpdateInput!) { updateProject(input: $input) { message } }", {
                input: { id: randomUUID(), patch: { name: "Changed" } },
            });
        expect(missing.errors?.[0]?.extensions.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("validates bulk identifiers and rolls back when any target is missing", async () => {
        const row = await suite.prisma().project.findFirstOrThrow();
        const count = await suite.prisma().project.count();
        const mutation = "mutation($input: ProjectPurgeInput!) { purgeProject(input: $input) { message } }";
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
        expect(await suite.prisma().project.count()).toBe(count);
        expect(await suite.prisma().project.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
    });

    it("rejects a missing parent without creating a record", async () => {
        const input = { profile: suite.profile(), name: "Created", url: "https://example.com" };
        const count = await suite.prisma().project.count();
        const result = await suite
            .application()
            .query("mutation($input: ProjectCreateInput!) { createProject(input: $input) { message } }", {
                input: { ...input, profile: randomUUID() },
            });
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.NOT_FOUND);
        expect(await suite.prisma().project.count()).toBe(count);
    });
});
