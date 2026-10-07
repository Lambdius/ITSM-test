import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "@jest/globals";

import { ErrorCode, Exception } from "~common/exceptions";
import { Experience } from "~context/domain/entities";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { ExperienceIntegrationHelpers } from "~testing/integration/domain-service/experience.helpers";

const helpers = new ExperienceIntegrationHelpers();

describe("ExperienceService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (prisma) => new CoreFixture(prisma),
    });
    let profile: Entities.Profile;

    beforeEach(async () => {
        profile = await suite.fixtures().createProfile();
    });

    function input(): Entities.Experience.ConstructorProps {
        return {
            profile: profile.id,
            company: "Created",
            position: "Developer",
            achievements: "Done",
            startDate: new Date("2024-01-01"),
            endDate: null,
        };
    }

    async function create(props = input()): Promise<Entities.Experience> {
        const result = await suite.transaction((transaction) =>
            suite.repository().experienceService.create({ transaction, input: props }),
        );
        expect(result).toEqual({ message: "Experience created successfully" });
        const [entity] = await suite
            .repository()
            .repositories.experiences.find({ where: { company: props.company, profile: props.profile } });
        expect(entity).toBeDefined();
        return entity!;
    }

    describe("create", () => {
        it("creates an entity with generated identity and persists its metadata", async () => {
            const entity = await create();
            expect(entity).toBeInstanceOf(Experience);
            expect(entity).toMatchObject({
                ...input(),
                id: expect.any(String),
                createdAt: expect.any(Date),
                updatedAt: null,
            });
            expect(await suite.repository().repositories.experiences.findById({ id: entity.id })).toEqual(entity);
        });

        it("rejects a missing parent without persisting a record", async () => {
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().experienceService.create({
                        transaction,
                        input: { ...input(), profile: randomUUID() },
                    }),
                ),
            ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND, message: "Profile not found" });
            expect(await suite.prisma().experience.count()).toBe(0);
        });
    });

    describe("update", () => {
        it("changes mutable fields and preserves identity, timestamps and omitted data", async () => {
            const entity = await create();
            const result = await suite.transaction((transaction) =>
                suite.repository().experienceService.update({
                    transaction,
                    id: entity.id,
                    patch: { company: "Updated" },
                }),
            );
            expect(result).toEqual({ message: "Experience updated successfully" });
            expect(await suite.repository().repositories.experiences.findById({ id: entity.id })).toMatchObject({
                ...entity,
                company: "Updated",
                updatedAt: entity.updatedAt,
            });
        });

        it.each([{}, { company: "Created" }])(
            "accepts an empty or unchanged patch %p without altering stored data",
            async (patch) => {
                const entity = await create();
                await expect(
                    suite.transaction((transaction) =>
                        suite.repository().experienceService.update({
                            transaction,
                            id: entity.id,
                            patch,
                        }),
                    ),
                ).resolves.toEqual({ message: "Experience updated successfully" });
                expect(await suite.repository().repositories.experiences.findById({ id: entity.id })).toEqual(entity);
            },
        );

        it("rejects a missing record", async () => {
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().experienceService.update({
                        transaction,
                        id: randomUUID(),
                        patch: { company: "Updated" },
                    }),
                ),
            ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND, message: "Resource not found" });
        });
    });

    describe("purge", () => {
        it("removes the requested set, deduplicates identifiers and preserves other records", async () => {
            const first = await create();
            const second = await create({ ...input(), company: "Second" });
            const other = await create({ ...input(), company: "Other" });
            const removed = await suite.transaction((transaction) =>
                suite.repository().experienceService.purge({
                    transaction,
                    identifiers: [first.id, second.id, first.id],
                }),
            );
            expect(removed).toEqual({ message: "Experiences purged successfully" });
            expect(await suite.repository().repositories.experiences.findById({ id: first.id })).toBeNull();
            expect(await suite.repository().repositories.experiences.findById({ id: second.id })).toBeNull();
            expect(await suite.repository().repositories.experiences.findById({ id: other.id })).toEqual(other);
        });

        it("keeps the whole set when one identifier is missing", async () => {
            const entity = await create();
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().experienceService.purge({
                        transaction,
                        identifiers: [entity.id, randomUUID()],
                    }),
                ),
            ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
            expect(await suite.repository().repositories.experiences.findById({ id: entity.id })).toEqual(entity);
        });
    });
    it("rolls back a persisted update when the transaction fails", async () => {
        const entity = await create();
        await expect(
            suite.transaction(async (transaction) => {
                await suite
                    .repository()
                    .experienceService.update({ transaction, id: entity.id, patch: { company: "Changed" } });
                throw Exception.conflict({ reason: "Force transaction rollback" });
            }),
        ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
        expect(await suite.repository().repositories.experiences.findById({ id: entity.id })).toEqual(entity);
    });
});
