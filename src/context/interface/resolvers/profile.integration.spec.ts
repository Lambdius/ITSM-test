import { describe, expect, it, jest } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { Experience, Profile, Project, Skill } from "~context/domain/entities";
import { graphqlSuite } from "~testing/integration/containers/graphql.suite";
import { DatabaseService } from "~infrastructure/database";
import { ErrorCode } from "~common/exceptions";

describe("ProfileResolver", () => {
    const suite = graphqlSuite();

    it("preloads selected relations through fragments and directives without repeating repository reads", async () => {
        const database = suite.application().application.get(DatabaseService);
        const profile = jest.spyOn(database.profile, "findMany");
        const skills = jest.spyOn(database.profileSkill, "findMany");
        const experience = jest.spyOn(database.experience, "findMany");
        const projects = jest.spyOn(database.project, "findMany");
        try {
            const document = `query($load: Boolean!, $skip: Boolean!, $first: Int!) {
                profile {
                    ...Details
                    experience @skip(if: $skip) { edges { node { id } } }
                }
            }
            fragment Details on Profile {
                selected: skills(first: $first) @include(if: $load) {
                    edges { node { name owner { ...Owner } } }
                    pageInfo { hasNextPage }
                }
            }
            fragment Owner on Profile {
                id
                projects(first: 1) { edges { node { profile } } }
            }`;
            const result = await suite.application().query(document, { load: true, skip: true, first: 1 });
            expect(result.errors).toBeUndefined();
            expect(result.data?.profile).toMatchObject({
                selected: {
                    edges: [
                        {
                            node: {
                                owner: {
                                    id: suite.profile(),
                                    projects: { edges: [{ node: { profile: suite.profile() } }] },
                                },
                            },
                        },
                    ],
                    pageInfo: { hasNextPage: true },
                },
            });
            expect(profile).toHaveBeenCalledTimes(1);
            expect(profile.mock.calls[0]?.[0]?.include).toHaveProperty("skills");
            expect(profile.mock.calls[0]?.[0]?.include).not.toHaveProperty("experience");
            expect(skills).not.toHaveBeenCalled();
            expect(experience).not.toHaveBeenCalled();
            expect(projects).not.toHaveBeenCalled();
            const skipped = await suite.application().query(document, { load: false, skip: true, first: 1 });
            expect(skipped).toEqual({ data: { profile: {} } });
            expect(profile.mock.calls[1]?.[0]?.include).not.toHaveProperty("skills");
        } finally {
            profile.mockRestore();
            skills.mockRestore();
            experience.mockRestore();
            projects.mockRestore();
        }
    });

    it("keeps separate aliases of a populated relation independent and validates their DTOs", async () => {
        const result = await suite.application().query(`{
            profile {
                small: skills(first: 1) { edges { node { owner { id } } } }
                large: skills(first: 2) { edges { node { owner { id } } } }
            }
        }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.profile).toEqual({
            small: { edges: [{ node: { owner: { id: suite.profile() } } }] },
            large: { edges: [{ node: { owner: { id: suite.profile() } } }, { node: { owner: { id: suite.profile() } } }] },
        });
        const invalid = await suite.application().query(`{
            profile { skills(first: -1) { edges { node { id } } } }
        }`);
        expect(invalid.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("exposes a connection and resolves a record by id", async () => {
        const row = await suite.prisma().profile.findFirstOrThrow();
        const result = await suite.application().query(`{
            profile(id: "${row.id}") { id }
            profiles(first: 1) { edges { cursor node { id } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } }
        }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.profile).toEqual({ id: row.id });
        expect(result.data?.profiles?.edges).toHaveLength(1);
    });

    it.each([
        ["ProfileOrderField", ["CREATED_AT"]],
        ["SkillOrderField", ["CREATED_AT"]],
        ["ProjectOrderField", ["CREATED_AT"]],
        ["ExperienceOrderField", ["CREATED_AT", "START_DATE"]],
    ] as const)("exposes only date fields in %s", async (name, fields) => {
        const result = await suite.application().query(`{ __type(name: "${name}") { enumValues { name } } }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.__type?.enumValues).toEqual(fields.map((field) => ({ name: field })));
    });

    it("validates page bounds, identifiers and nested predicates", async () => {
        expect(
            (await suite.application().query("{ profiles(first: 101) { edges { node { id } } } }")).errors?.[0]?.extensions
                .code,
        ).toBe(ErrorCode.BAD_REQUEST);
        expect((await suite.application().query('{ profile(id: "invalid") { id } }')).errors?.[0]?.extensions.code).toBe(
            ErrorCode.BAD_REQUEST,
        );
        const result = await suite
            .application()
            .query('{ profiles(filter: { id: { predicate: EQUAL, value: "invalid" } }) { edges { node { id } } } }');
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("returns null for a missing record", async () => {
        await suite.prisma().profile.deleteMany();
        expect(await suite.application().query(`{ profile(id: "${suite.profile()}") { id } }`)).toEqual({
            data: { profile: null },
        });
    });

    it("resolves nested connections with independent filters and aliases", async () => {
        const result = await suite.application().query(`{
            profile {
                name createdAt updatedAt links { label url }
                skills(filter: { name: { predicate: ILIKE, value: "sCrIpT" } }) { edges { node { name } } }
                all: skills { edges { node { name } } }
                experience { edges { node { company startDate endDate achievements } } }
                projects { edges { node { name url } } }
            }
        }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.profile).toMatchObject({
            name: "Test Profile",
            createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            updatedAt: null,
            skills: { edges: expect.arrayContaining([{ node: { name: "JavaScript" } }, { node: { name: "TypeScript" } }]) },
            experience: {
                edges: [
                    {
                        node: {
                            startDate: "2023-06-01T00:00:00.000Z",
                            endDate: null,
                            achievements: "Completed integration project",
                        },
                    },
                ],
            },
        });
    });

    it.each([
        ["skills", "skills"],
        ["experience", "experiences"],
        ["projects", "projects"],
    ])("binds nested %s filters and cursors to the parent profile", async (field, query) => {
        const other = new Profile({ name: "Other", description: "", links: [] });
        await suite.prisma().profile.create({ data: other });
        await suite.prisma().profileSkill.create({ data: new Skill({ profile: other.id, name: "Other skill" }) });
        await suite.prisma().project.create({
            data: new Project({ profile: other.id, name: "Other project", url: "https://example.com" }),
        });
        await suite.prisma().experience.create({
            data: new Experience({
                profile: other.id,
                company: "Other company",
                position: "Developer",
                achievements: "",
                startDate: new Date("2024-01-01"),
                endDate: null,
            }),
        });
        const result = await suite.application().query<Integration.GraphQL.ProfileLists>(`{
            profile(id: "${suite.profile()}") {
                children: ${field}(first: 1, filter: { profile: { predicate: EQUAL, value: ["${other.id}"] } }) {
                    edges { node { profile } }
                    pageInfo { endCursor }
                }
            }
            selected: ${query}(filter: { profile: { predicate: EQUAL, value: ["${other.id}"] } }) {
                edges { node { profile } }
            }
        }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.profile?.children?.edges).toEqual([{ node: { profile: suite.profile() } }]);
        expect(result.data?.selected?.edges).toEqual([{ node: { profile: other.id } }]);
        const after = result.data?.profile?.children?.pageInfo?.endCursor;
        expect(after).toEqual(expect.any(String));
        const crossed = await suite.application().query(`{
            profile(id: "${other.id}") {
                ${field}(after: "${after}") { edges { node { id } } }
            }
        }`);
        expect(crossed.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("reports invalid stored links without stack traces and serves Sandbox", async () => {
        await suite.prisma().$executeRaw`
            UPDATE "profile" SET "links" = '[null]'::jsonb WHERE "id" = ${suite.profile()}::uuid
        `;
        const result = await suite.application().query("{ profile { links { label url } } }");
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.INTERNAL);
        expect(result.errors?.[0]?.message).toBe("Cannot return null for non-nullable field Profile.links.");
        expect(result.data).toEqual({ profile: null });
        expect(result.errors?.[0]?.extensions).not.toHaveProperty("stacktrace");
        const landing = await fetch(`${suite.application().url}/graphql`, { headers: { accept: "text/html" } });
        expect(landing.status).toBe(200);
        expect(await landing.text()).toContain("embeddable-sandbox");
        expect((await fetch(`${suite.application().url}/missing`)).status).toBe(404);
    });

    it("does not expose entity fields in mutation responses", async () => {
        const before = await suite.prisma().profile.count();
        const result = await suite.application().query(`mutation {
            createProfile(input: { name: "Created", description: "", links: [] }) { message id }
        }`);
        expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
        expect(result.data).toBeUndefined();
        expect(await suite.prisma().profile.count()).toBe(before);
    });

    it("returns success messages from commands and retrieves data through queries", async () => {
        const input = {
            name: "Created",
            description: "Description",
            links: [{ label: "GitHub", url: "https://github.com/example" }],
        };
        const create = "mutation($input: ProfileCreateInput!) { createProfile(input: $input) { message } }";
        const created = await suite.application().query(create, { input });
        expect(created).toEqual({ data: { createProfile: { message: "Profile created successfully" } } });
        const stored = await suite.prisma().profile.findFirstOrThrow({ where: { name: "Created" } });
        const entity = { ...input, id: stored.id, createdAt: stored.createdAt.toISOString(), updatedAt: null };
        const read = await suite
            .application()
            .query(`{ profile(id: "${stored.id}") { id createdAt updatedAt name description links { label url } } }`);
        expect(read).toEqual({ data: { profile: entity } });
        const updated = await suite
            .application()
            .query("mutation($input: ProfileUpdateInput!) { updateProfile(input: $input) { message } }", {
                input: { id: stored.id, patch: { name: "Updated" } },
            });
        expect(updated).toEqual({ data: { updateProfile: { message: "Profile updated successfully" } } });
        const after = await suite
            .application()
            .query(`{ profile(id: "${stored.id}") { id createdAt updatedAt name description links { label url } } }`);
        expect(after.errors).toBeUndefined();
        expect(after.data?.profile).toEqual({ ...entity, name: "Updated", updatedAt: expect.any(String) });
        const second = await suite.application().query(create, { input: { ...input, name: "Second" } });
        expect(second).toEqual({ data: { createProfile: { message: "Profile created successfully" } } });
        const other = await suite.prisma().profile.findFirstOrThrow({ where: { name: "Second" } });
        const identifiers = [stored.id, other.id];
        const revoked = await suite
            .application()
            .query("mutation($input: ProfileRevokeInput!) { revokeProfile(input: $input) { message } }", {
                input: { identifiers },
            });
        expect(revoked).toEqual({ data: { revokeProfile: { message: "Profiles revoked successfully" } } });
        const purged = await suite
            .application()
            .query("mutation($input: ProfilePurgeInput!) { purgeProfile(input: $input) { message } }", {
                input: { identifiers },
            });
        expect(purged).toEqual({ data: { purgeProfile: { message: "Profiles purged successfully" } } });
        expect(await suite.prisma().profile.count({ where: { id: { in: identifiers } } })).toBe(0);
    });

    it("validates DTO input, accepts unchanged patches and reports missing records", async () => {
        const count = await suite.prisma().profile.count();
        const input = {
            name: "Created",
            description: "Description",
            links: [{ label: "GitHub", url: "https://github.com/example" }],
        };
        const invalid = await suite
            .application()
            .query("mutation($input: ProfileCreateInput!) { createProfile(input: $input) { message } }", {
                input: { ...input, ...{ name: "" } },
            });
        expect(invalid.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
        expect(await suite.prisma().profile.count()).toBe(count);
        const created = await suite
            .application()
            .query<Integration.GraphQL.Mutation>(
                "mutation($input: ProfileCreateInput!) { createProfile(input: $input) { message } }",
                { input },
            );
        expect(created.errors).toBeUndefined();
        const { id } = await suite.prisma().profile.findFirstOrThrow({ where: { name: "Created" } });
        const stored = await suite.prisma().profile.findUniqueOrThrow({ where: { id } });
        await Promise.all(
            (
                [
                    [{ name: null }, ErrorCode.BAD_REQUEST],
                    [{ name: "" }, ErrorCode.BAD_REQUEST],
                ] as const
            ).map(async ([patch, code]) => {
                const result = await suite
                    .application()
                    .query("mutation($input: ProfileUpdateInput!) { updateProfile(input: $input) { message } }", {
                        input: { id, patch },
                    });
                expect(result.errors?.[0]?.extensions.code).toBe(code);
                expect(await suite.prisma().profile.findUniqueOrThrow({ where: { id } })).toEqual(stored);
            }),
        );
        const result = await suite
            .application()
            .query("mutation($input: ProfileUpdateInput!) { updateProfile(input: $input) { message } }", {
                input: { id, patch: {} },
            });
        expect(result).toEqual({ data: { updateProfile: { message: "Profile updated successfully" } } });
        expect(await suite.prisma().profile.findUniqueOrThrow({ where: { id } })).toEqual(stored);
        const missing = await suite
            .application()
            .query("mutation($input: ProfileUpdateInput!) { updateProfile(input: $input) { message } }", {
                input: { id: randomUUID(), patch: { name: "Changed" } },
            });
        expect(missing.errors?.[0]?.extensions.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("validates bulk identifiers and rolls back when any target is missing", async () => {
        const row = await suite.prisma().profile.findFirstOrThrow();
        const count = await suite.prisma().profile.count();
        const mutation = "mutation($input: ProfilePurgeInput!) { purgeProfile(input: $input) { message } }";
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
        expect(await suite.prisma().profile.count()).toBe(count);
        expect(await suite.prisma().profile.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
    });

    it("validates nested links in both create and update DTOs", async () => {
        const create = "mutation($input: ProfileCreateInput!) { createProfile(input: $input) { message } }";
        const update = "mutation($input: ProfileUpdateInput!) { updateProfile(input: $input) { message } }";
        const stored = await suite.prisma().profile.findUniqueOrThrow({ where: { id: suite.profile() } });
        await Promise.all(
            [null, [{ label: "", url: "https://example.com" }], [{ label: "Site", url: "invalid" }]].map(async (links) => {
                const created = await suite
                    .application()
                    .query(create, { input: { name: "Invalid links", description: "", links } });
                expect(created.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
                const updated = await suite
                    .application()
                    .query(update, { input: { id: suite.profile(), patch: { links } } });
                expect(updated.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
            }),
        );
        expect(await suite.prisma().profile.count()).toBe(1);
        expect(await suite.prisma().profile.findUniqueOrThrow({ where: { id: suite.profile() } })).toEqual(stored);
        const links = [{ label: "Site", url: "https://example.com" }];
        expect(
            (await suite.application().query(update, { input: { id: suite.profile(), patch: { links } } })).errors,
        ).toBeUndefined();
        expect((await suite.prisma().profile.findUniqueOrThrow({ where: { id: suite.profile() } })).links).toEqual(links);
        expect(
            (await suite.application().query(update, { input: { id: suite.profile(), patch: { links: [] } } })).errors,
        ).toBeUndefined();
        expect((await suite.prisma().profile.findUniqueOrThrow({ where: { id: suite.profile() } })).links).toEqual([]);
    });

    it("purges a profile and its children while preserving other profiles", async () => {
        const other = await suite
            .application()
            .query<Integration.GraphQL.Mutation>(
                'mutation { createProfile(input: { name: "Other", description: "", links: [] }) { message } }',
            );
        expect(other.errors).toBeUndefined();
        const revoked = await suite
            .application()
            .query(`mutation { revokeProfile(input: { identifiers: ["${suite.profile()}"] }) { message } }`);
        expect(revoked.errors).toBeUndefined();
        const result = await suite
            .application()
            .query(`mutation { purgeProfile(input: { identifiers: ["${suite.profile()}"] }) { message } }`);
        expect(result.errors).toBeUndefined();
        expect(result.data?.purgeProfile).toEqual({ message: "Profiles purged successfully" });
        expect(await suite.prisma().profileSkill.count({ where: { profile: suite.profile() } })).toBe(0);
        expect(await suite.prisma().experience.count({ where: { profile: suite.profile() } })).toBe(0);
        expect(await suite.prisma().project.count({ where: { profile: suite.profile() } })).toBe(0);
        expect(await suite.prisma().profile.findFirst({ where: { name: "Other" } })).not.toBeNull();
    });

    it("exposes revocation state and explicit filters without hiding children", async () => {
        const active = await suite.application().query(`{ profile(id: "${suite.profile()}") { isRevoked } }`);
        expect(active.data?.profile).toEqual({ isRevoked: false });
        const purgeActive = await suite
            .application()
            .query(`mutation { purgeProfile(input: { identifiers: ["${suite.profile()}"] }) { message } }`);
        expect(purgeActive.errors?.[0]?.extensions.code).toBe(ErrorCode.INVARIANT_VIOLATION);
        const revoked = await suite.application().query(`mutation {
            revokeProfile(input: { identifiers: ["${suite.profile()}"] }) { message }
        }`);
        expect(revoked.errors).toBeUndefined();
        expect(revoked.data?.revokeProfile).toEqual({ message: "Profiles revoked successfully" });
        const read = await suite.application().query(`{
            profile(id: "${suite.profile()}") { isRevoked skills { edges { node { id } } } }
            active: profiles(filter: { isRevoked: false }) { edges { node { id } } }
            revoked: profiles(filter: { isRevoked: true }) { edges { node { id } } }
        }`);
        expect(read.errors).toBeUndefined();
        expect(read.data?.profile).toMatchObject({ isRevoked: true, skills: { edges: expect.any(Array) } });
        expect(read.data?.active?.edges).toEqual([]);
        expect(read.data?.revoked?.edges).toEqual([{ node: { id: suite.profile() } }]);
        expect(await suite.prisma().profileSkill.count({ where: { profile: suite.profile() } })).toBe(9);
        const restored = await suite.application().query(`mutation {
            restoreProfile(input: { identifiers: ["${suite.profile()}"] }) { message }
        }`);
        expect(restored.errors).toBeUndefined();
        expect(restored.data?.restoreProfile).toEqual({ message: "Profiles restored successfully" });
        expect((await suite.prisma().profile.findUniqueOrThrow({ where: { id: suite.profile() } })).isRevoked).toBe(false);
    });

    it.each(["Revoke", "Restore"] as const)("validates bulk %s DTOs through the global pipe", async (operation) => {
        const name = operation.toLowerCase();
        const mutation = `mutation($input: Profile${operation}Input!) { ${name}Profile(input: $input) { message } }`;
        const before = await suite.prisma().profile.findUniqueOrThrow({ where: { id: suite.profile() } });
        await Promise.all(
            [[], [suite.profile(), suite.profile()], ["invalid"]].map(async (identifiers) => {
                const result = await suite.application().query(mutation, { input: { identifiers } });
                expect(result.errors?.[0]?.extensions.code).toBe(ErrorCode.BAD_REQUEST);
            }),
        );
        expect(await suite.prisma().profile.findUniqueOrThrow({ where: { id: suite.profile() } })).toEqual(before);
    });
});
