import { describe, expect, it } from "@jest/globals";
import { PrismaPg } from "@prisma/adapter-pg";

import { PublicLinkOperator, PublicStringOperator, QueryOrder } from "~infrastructure/database/enums";
import { ProjectRepository } from "~context/infrastructure/repositories";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import { ProfileFixture } from "~testing/integration/repositories";
import { ProfileMapper } from "~context/infrastructure/mappers";
import { ErrorCode, Exception } from "~common/exceptions";
import { PrismaClient } from "~infrastructure/database/generated/client";
import { Population, PopulationRegistry } from "~context/infrastructure/populate";
import { PostgresResource } from "~testing/integration/containers/postgres.resource";
import { Profile, Skill } from "~context/domain/entities";

import { BaseRepository } from "./mixin";

class TestRepository extends BaseRepository<Entities.Profile, Repositories.Mappers.Profile.Types, "profile">({
    Mapper: ProfileMapper,
    Entity: Profile,
    populate: (props) => PopulationRegistry.profile.build(props),
}) {
    public override readonly resource = "profile";

    public constructor(prisma: Repositories.Base.Client<Entities.Profile, Repositories.Mappers.Profile.Types, "profile">) {
        super(prisma);
    }
}

describe("BaseRepository (PostgreSQL)", () => {
    const factory = new EntityFactoryRegistry();
    const suite = postgresSuite({
        repository: ({ prisma }) => new TestRepository(prisma),
        fixture: (prisma) => new ProfileFixture(prisma),
    });

    it.each(["findById", "find", "findMany"] as const)(
        "loads nested relations in one SQL statement through %s",
        async (method) => {
            const profile = await suite.fixtures().presentationScenario();
            const client = new PrismaClient({
                adapter: new PrismaPg({
                    connectionString: PostgresResource.config().getOrThrow("DATABASE_URL", { infer: true }),
                }),
                log: [{ emit: "event", level: "query" }],
            });
            const queries: string[] = [];
            client.$on("query", ({ query }) => queries.push(query));
            const repository = new TestRepository(client);
            const populate: Repositories.Population.Profile = {
                skills: {
                    first: 1,
                    filter: { name: { predicate: PublicStringOperator.ILIKE, value: ["script"] } },
                    populate: { owner: { projects: { first: 1 } } },
                },
                experience: {},
                projects: {},
            };
            try {
                await client.$connect();
                queries.length = 0;
                const result =
                    method === "findById"
                        ? await repository.findById({ id: profile.id, populate })
                        : method === "find"
                          ? (await repository.find({ where: { id: profile.id }, populate }))[0]
                          : (await repository.findMany({ populate })).edges[0]?.node;
                expect(queries).toHaveLength(1);
                expect(result).toBeInstanceOf(Profile);
                expect(result).not.toHaveProperty("skills");
                const skills = Population.get(result!, "skills");
                expect(skills?.edges).toHaveLength(1);
                expect(skills?.pageInfo.hasNextPage).toBe(true);
                const skill = skills!.edges[0]!.node;
                expect(skill).toBeInstanceOf(Skill);
                expect(skill.name).toMatch(/Script/);
                const owner = Population.get(skill, "owner");
                expect(owner).toBeInstanceOf(Profile);
                expect(owner?.id).toBe(profile.id);
                const projects = Population.get(owner!, "projects");
                expect(projects?.edges).toHaveLength(1);
            } finally {
                await client.$disconnect();
            }
        },
    );

    it("paginates joined collections per parent and continues with the same scoped cursor", async () => {
        const profile = await suite.fixtures().presentationScenario();
        const other = await suite.fixtures().createProfile({ name: "Other" });
        await suite.prisma().profileSkill.create({ data: new Skill({ profile: other.id, name: "Other skill" }) });
        const page = await suite.repository().findMany({ populate: { skills: { first: 2 } } });
        const first = page.edges.find(({ node }) => node.id === profile.id)!.node;
        const second = page.edges.find(({ node }) => node.id === other.id)!.node;
        const skills = Population.get(first, "skills")!;
        const otherSkills = Population.get(second, "skills")!;
        expect(skills.edges).toHaveLength(2);
        expect(skills.pageInfo.hasNextPage).toBe(true);
        expect(otherSkills.edges.map(({ node }) => node.name)).toEqual(["Other skill"]);
        expect(otherSkills.pageInfo.hasNextPage).toBe(false);
        const continued = await suite.transaction((transaction) =>
            suite.repository().findById({
                id: profile.id,
                transaction,
                populate: { skills: { first: 2, after: skills.pageInfo.endCursor } },
            }),
        );
        const next = Population.get(continued!, "skills")!;
        expect(next.edges).toHaveLength(2);
        expect(new Set([...skills.edges, ...next.edges].map(({ node }) => node.id)).size).toBe(4);
        await expect(
            suite.repository().findById({
                id: other.id,
                populate: { skills: { first: 2, after: skills.pageInfo.endCursor } },
            }),
        ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it("finds entities with a custom where, with and without a transaction", async () => {
        const entities = ["Match A", "Match B", "Other"].map(
            (name) => new Profile({ name, description: "Find fixture", links: [] }),
        );
        await suite.prisma().profile.createMany({ data: entities });
        const where: Repositories.Mappers.Profile.Where = {
            AND: [
                { name: { startsWith: "Match" } },
                { createdAt: { gte: new Date("2000-01-01") } },
                { NOT: { name: "Match B" } },
            ],
        };
        const result = await suite.repository().find({ where });
        expect(result).toEqual([entities[0]]);
        expect(result[0]).toBeInstanceOf(Profile);
        expect(await suite.transaction((transaction) => suite.repository().find({ where, transaction }))).toEqual(result);
        expect(await suite.repository().find({ where: { name: "Missing" } })).toEqual([]);
    });

    it("returns null or a mapped entity and preserves links across all reads", async () => {
        expect(await suite.repository().findById({ id: factory.createProfile().id })).toBeNull();
        const profile = await suite.fixtures().createProfile();
        const entity = await suite.repository().findById({ id: profile.id });
        expect(entity).toBeInstanceOf(Profile);
        expect(entity?.links).toEqual([{ label: "GitHub", url: "https://github.com/example" }]);
        const entities = await suite.repository().find({ where: { id: profile.id } });
        const page = await suite.repository().findMany({});
        for (const restored of [entity, ...entities, ...page.edges.map(({ node }) => node)]) {
            expect(restored).toBeInstanceOf(Profile);
            expect(restored?.links).toEqual([{ label: "GitHub", url: "https://github.com/example" }]);
        }
    });

    it("paginates duplicate sort values without overlaps or omissions", async () => {
        await suite.fixtures().duplicateSortValuesScenario();
        const first = await suite.repository().findMany({ first: 1 });
        const second = await suite.repository().findMany({ first: 1, after: first.pageInfo.endCursor });
        expect(first.pageInfo.hasNextPage).toBe(true);
        expect(second.pageInfo.hasNextPage).toBe(false);
        expect(new Set([...first.edges, ...second.edges].map(({ node }) => node.id)).size).toBe(2);
        const empty = await suite.repository().findMany({ first: 1, after: second.pageInfo.endCursor });
        expect(empty).toEqual({
            edges: [],
            pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
        });
    });

    it("binds cursors to the filter and sort", async () => {
        await suite.fixtures().createProfile();
        const first = await suite.repository().findMany({});
        const after = first.pageInfo.endCursor;
        await expect(
            suite
                .repository()
                .findMany({ after, filter: { name: { predicate: PublicStringOperator.EQUAL, value: ["other"] } } }),
        ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
        await expect(
            suite.repository().findMany({ after, orderBy: [{ field: "createdAt", direction: QueryOrder.DESC }] }),
        ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it("hydrates entity metadata in single and bulk reads inside a transaction", async () => {
        const entity = new Profile({
            name: "Created",
            description: "Description",
            links: [{ label: "Site", url: "https://example.com" }],
        });
        await suite.transaction(async (transaction) => {
            await transaction.profile.create({
                data: entity,
            });
            expect(await suite.repository().findById({ id: entity.id, transaction })).toEqual(entity);
        });
        const createdAt = entity.createdAt;
        entity.name = "Updated";
        entity.links = [{ label: "GitHub", url: "https://github.com/example" }];
        entity.updatedAt = new Date();
        await suite.transaction(async (transaction) => {
            await transaction.profile.update({
                where: { id: entity.id },
                data: entity,
            });
            expect(await suite.repository().find({ where: { id: { in: [entity.id] } }, transaction })).toEqual([entity]);
        });
        const restored = await suite.repository().findById({ id: entity.id });
        expect(restored).toBeInstanceOf(Profile);
        expect(restored).toEqual(entity);
        expect(restored?.createdAt).toEqual(createdAt);
    });

    it("continues from a deleted cursor row and handles duplicate sort values", async () => {
        await suite.prisma().profile.createMany({
            data: [0, 1, 2].map(() => ({
                ...new Profile({ name: "Same", description: "", links: [] }),
                createdAt: new Date("2024-01-01"),
            })),
        });
        const orderBy = [{ field: "createdAt" as const, direction: QueryOrder.ASC }];
        const first = await suite.repository().findMany({ first: 1, orderBy });
        await suite.prisma().profile.delete({ where: { id: first.edges[0]!.node.id } });
        const rest = await suite.repository().findMany({ after: first.pageInfo.endCursor, orderBy });
        expect(rest.edges).toHaveLength(2);
        expect(rest.pageInfo.hasNextPage).toBe(false);
        expect(new Set(rest.edges.map(({ node }) => node.id)).size).toBe(2);
    });

    it("orders descending dates and uses the internal id to traverse equal timestamps", async () => {
        const entities = [new Date("2024-01-01"), new Date("2025-01-01")].flatMap((createdAt) =>
            ["B", "A"].map((name) => ({ ...new Profile({ name, description: "", links: [] }), createdAt })),
        );
        await suite.prisma().profile.createMany({ data: entities });
        const orderBy: Repositories.Mappers.Profile.Sort = [{ field: "createdAt", direction: QueryOrder.DESC }];
        const first = await suite.repository().findMany({ first: 1, orderBy });
        const second = await suite.repository().findMany({ first: 1, orderBy, after: first.pageInfo.endCursor });
        const third = await suite.repository().findMany({ first: 1, orderBy, after: second.pageInfo.endCursor });
        const fourth = await suite.repository().findMany({ first: 1, orderBy, after: third.pageInfo.endCursor });
        const pages = [first, second, third, fourth];
        const expected = entities.sort(
            (left, right) => right.createdAt.getTime() - left.createdAt.getTime() || left.id.localeCompare(right.id),
        );
        expect(pages.map((page) => page.edges[0]!.node.id)).toEqual(expected.map(({ id }) => id));
        expect(pages.map((page) => page.pageInfo.hasNextPage)).toEqual([true, true, true, false]);
    });

    it("binds cursors to the repository resource", async () => {
        await suite.fixtures().createProfile();
        const first = await suite.repository().findMany({});
        const other = new ProjectRepository(suite.prisma());
        await expect(other.findMany({ after: first.pageInfo.endCursor })).rejects.toMatchObject({
            code: ErrorCode.BAD_REQUEST,
        });
    });

    it("applies mapper filters before pagination", async () => {
        await suite.prisma().profile.createMany({
            data: ["Other", "Match A", "Match B", "Match C"].map((name, index) => ({
                ...new Profile({ name, description: "", links: [] }),
                createdAt: new Date(Date.UTC(2024, 0, index + 1)),
            })),
        });
        const props: Repositories.Base.FindMany<Repositories.Mappers.Profile.Types> = {
            first: 2,
            filter: { name: { predicate: PublicStringOperator.ILIKE, value: ["match"] } },
            orderBy: [{ field: "createdAt", direction: QueryOrder.ASC }],
        };
        const first = await suite.repository().findMany(props);
        const second = await suite.repository().findMany({ ...props, after: first.pageInfo.endCursor });
        expect(first.edges.map(({ node }) => node.name)).toEqual(["Match A", "Match B"]);
        expect(second.edges.map(({ node }) => node.name)).toEqual(["Match C"]);
        expect(first.pageInfo.hasNextPage).toBe(true);
        expect(second.pageInfo.hasNextPage).toBe(false);
    });

    it("reads uncommitted rows through the supplied transaction and respects rollback", async () => {
        const entity = new Profile({ name: "Rollback", description: "", links: [] });
        const failure = Exception.conflict({ operation: "rollback fixture" });
        await expect(
            suite.transaction(async (transaction) => {
                await transaction.profile.create({ data: entity });
                expect(await suite.repository().findById({ id: entity.id, transaction })).toEqual(entity);
                expect(await suite.repository().find({ where: { id: entity.id }, transaction })).toEqual([entity]);
                throw failure;
            }),
        ).rejects.toBe(failure);
        expect(await suite.repository().findById({ id: entity.id })).toBeNull();
    });

    it.each(["findById", "find", "findMany"] as const)("maps database errors in %s", async (method) => {
        const operation =
            method === "findById"
                ? suite.repository().findById({ id: "invalid-uuid" })
                : method === "find"
                  ? suite.repository().find({ where: { id: "invalid-uuid" } })
                  : suite.repository().findMany({
                        filter: { id: { predicate: PublicLinkOperator.EQUAL, value: ["invalid-uuid"] } },
                    });
        await expect(operation).rejects.toMatchObject({ code: ErrorCode.INTERNAL, message: "Internal server error" });
    });
});
