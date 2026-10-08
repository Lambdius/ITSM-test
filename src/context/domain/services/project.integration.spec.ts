import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { ProjectIntegrationHelpers } from "~testing/integration/domain-service/project.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { ErrorCode, Exception } from "~common/exceptions";
import { Project } from "~context/domain/entities";

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
        it("changes mutable fields and updatedAt while preserving identity, createdAt and omitted data", async () => {
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
                updatedAt: expect.any(Date),
            });
        });

        it("skips an empty patch without querying or changing stored metadata", async () => {
            const entity = await create();
            const stored = await suite.prisma().project.update({
                where: { id: entity.id },
                data: { updatedAt: new Date("2025-01-01T00:00:00.000Z") },
            });
            const result = await suite.transaction(async (transaction) => {
                const update = jest.spyOn(transaction.project, "update");
                try {
                    const result = await suite.repository().projectService.update({
                        transaction,
                        id: entity.id,
                        patch: {},
                    });
                    expect(update).not.toHaveBeenCalled();
                    return result;
                } finally {
                    update.mockRestore();
                }
            });
            expect(result).toEqual({ message: "Project updated successfully" });
            expect(await suite.prisma().project.findUniqueOrThrow({ where: { id: entity.id } })).toEqual(stored);
        });

        it("updates metadata for a nonempty patch containing the current value", async () => {
            const entity = await create();
            await suite.transaction((transaction) =>
                suite.repository().projectService.update({
                    transaction,
                    id: entity.id,
                    patch: { name: "Created" },
                }),
            );
            expect(await suite.repository().repositories.projects.findById({ id: entity.id })).toEqual({
                ...entity,
                updatedAt: expect.any(Date),
            });
        });

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
