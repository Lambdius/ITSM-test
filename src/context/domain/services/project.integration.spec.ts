import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "@jest/globals";

import { ErrorCode, Exception } from "~common/exceptions";
import { Project } from "~context/domain/entities";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { ProjectIntegrationHelpers } from "~testing/integration/domain-service/project.helpers";

const helpers = new ProjectIntegrationHelpers();

describe("ProjectService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (prisma) => new CoreFixture(prisma),
    });
    let profile: Entities.Profile;

    beforeEach(async () => {
        profile = await suite.fixtures().createProfile();
    });

    function input(): Entities.Project.ConstructorProps {
        return { profile: profile.id, name: "Created", url: "https://example.com" };
    }

    async function create(props = input()): Promise<Entities.Project> {
        const result = await suite.transaction((transaction) =>
            suite.repository().projectService.create({ transaction, input: props }),
        );
        expect(result).toEqual({ message: "Project created successfully" });
        const [entity] = await suite
            .repository()
            .repositories.projects.find({ where: { name: props.name, profile: props.profile } });
        expect(entity).toBeDefined();
        return entity!;
    }

    describe("create", () => {
        it("creates an entity with generated identity and persists its metadata", async () => {
            const entity = await create();
            expect(entity).toBeInstanceOf(Project);
            expect(entity).toMatchObject({
                ...input(),
                id: expect.any(String),
                createdAt: expect.any(Date),
                updatedAt: null,
            });
            expect(await suite.repository().repositories.projects.findById({ id: entity.id })).toEqual(entity);
        });

        it("rejects a missing parent without persisting a record", async () => {
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().projectService.create({
                        transaction,
                        input: { ...input(), profile: randomUUID() },
                    }),
                ),
            ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND, message: "Profile not found" });
            expect(await suite.prisma().project.count()).toBe(0);
        });
    });

    describe("update", () => {
        it("changes mutable fields and preserves identity, timestamps and omitted data", async () => {
            const entity = await create();
            const result = await suite.transaction((transaction) =>
                suite.repository().projectService.update({
                    transaction,
                    id: entity.id,
                    patch: { name: "Updated" },
                }),
            );
            expect(result).toEqual({ message: "Project updated successfully" });
            expect(await suite.repository().repositories.projects.findById({ id: entity.id })).toMatchObject({
                ...entity,
                name: "Updated",
                updatedAt: entity.updatedAt,
            });
        });

        it.each([{}, { name: "Created" }])(
            "accepts an empty or unchanged patch %p without altering stored data",
            async (patch) => {
                const entity = await create();
                await expect(
                    suite.transaction((transaction) =>
                        suite.repository().projectService.update({
                            transaction,
                            id: entity.id,
                            patch,
                        }),
                    ),
                ).resolves.toEqual({ message: "Project updated successfully" });
                expect(await suite.repository().repositories.projects.findById({ id: entity.id })).toEqual(entity);
            },
        );

        it("rejects a missing record", async () => {
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().projectService.update({
                        transaction,
                        id: randomUUID(),
                        patch: { name: "Updated" },
                    }),
                ),
            ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND, message: "Resource not found" });
        });
    });

    describe("purge", () => {
        it("removes the requested set, deduplicates identifiers and preserves other records", async () => {
            const first = await create();
            const second = await create({ ...input(), name: "Second" });
            const other = await create({ ...input(), name: "Other" });
            const removed = await suite.transaction((transaction) =>
                suite.repository().projectService.purge({
                    transaction,
                    identifiers: [first.id, second.id, first.id],
                }),
            );
            expect(removed).toEqual({ message: "Projects purged successfully" });
            expect(await suite.repository().repositories.projects.findById({ id: first.id })).toBeNull();
            expect(await suite.repository().repositories.projects.findById({ id: second.id })).toBeNull();
            expect(await suite.repository().repositories.projects.findById({ id: other.id })).toEqual(other);
        });

        it("keeps the whole set when one identifier is missing", async () => {
            const entity = await create();
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().projectService.purge({
                        transaction,
                        identifiers: [entity.id, randomUUID()],
                    }),
                ),
            ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
            expect(await suite.repository().repositories.projects.findById({ id: entity.id })).toEqual(entity);
        });
    });
    it("rolls back a persisted update when the transaction fails", async () => {
        const entity = await create();
        await expect(
            suite.transaction(async (transaction) => {
                await suite.repository().projectService.update({ transaction, id: entity.id, patch: { name: "Changed" } });
                throw Exception.conflict({ reason: "Force transaction rollback" });
            }),
        ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
        expect(await suite.repository().repositories.projects.findById({ id: entity.id })).toEqual(entity);
    });
});
