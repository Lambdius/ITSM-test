import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { ProfileIntegrationHelpers } from "~testing/integration/domain-service/profile.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { ErrorCode, Exception } from "~common/exceptions";
import { Profile } from "~context/domain/entities";

const helpers = new ProfileIntegrationHelpers();

describe("ProfileService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (prisma) => new CoreFixture(prisma),
    });
    let profile: Entities.Profile;

    beforeEach(async () => {
        profile = await suite.fixtures().createProfile();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    function input(): Entities.Profile.ConstructorProps {
        return { name: "Created", description: "Description", links: [{ label: "Site", url: "https://example.com" }] };
    }

    async function create(props = input()): Promise<Entities.Profile> {
        const result = await suite.transaction((transaction) =>
            suite.repository().profileService.create({ transaction, input: props }),
        );
        expect(result).toEqual({ message: "Profile created successfully" });
        const [entity] = await suite.repository().repositories.profiles.find({ where: { name: props.name } });
        expect(entity).toBeDefined();
        return entity!;
    }

    describe("create", () => {
        it("creates an entity with generated identity and persists its metadata", async () => {
            const entity = await create();
            expect(entity).toBeInstanceOf(Profile);
            expect(entity).toMatchObject({
                ...input(),
                id: expect.any(String),
                createdAt: expect.any(Date),
                updatedAt: null,
            });
            expect(await suite.repository().repositories.profiles.findById({ id: entity.id })).toEqual(entity);
        });
    });

    describe("update", () => {
        it("changes mutable fields and updatedAt while preserving identity, createdAt and omitted data", async () => {
            const entity = await create();
            const result = await suite.transaction((transaction) =>
                suite.repository().profileService.update({
                    transaction,
                    id: entity.id,
                    patch: { name: "Updated" },
                }),
            );
            expect(result).toEqual({ message: "Profile updated successfully" });
            expect(await suite.repository().repositories.profiles.findById({ id: entity.id })).toMatchObject({
                ...entity,
                name: "Updated",
                updatedAt: expect.any(Date),
            });
        });

        it("skips an empty patch without querying or changing stored metadata", async () => {
            const entity = await create();
            const stored = await suite.prisma().profile.update({
                where: { id: entity.id },
                data: { updatedAt: new Date("2025-01-01T00:00:00.000Z") },
            });
            const result = await suite.transaction(async (transaction) => {
                const update = jest.spyOn(transaction.profile, "update");
                try {
                    const result = await suite.repository().profileService.update({
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
            expect(result).toEqual({ message: "Profile updated successfully" });
            expect(await suite.prisma().profile.findUniqueOrThrow({ where: { id: entity.id } })).toEqual(stored);
        });

        it("updates metadata for a nonempty patch containing the current value", async () => {
            const entity = await create();
            await suite.transaction((transaction) =>
                suite.repository().profileService.update({
                    transaction,
                    id: entity.id,
                    patch: { name: "Created" },
                }),
            );
            expect(await suite.repository().repositories.profiles.findById({ id: entity.id })).toEqual({
                ...entity,
                updatedAt: expect.any(Date),
            });
        });

        it("rejects a missing record", async () => {
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().profileService.update({
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
            await suite.transaction((transaction) =>
                suite.repository().profileService.revoke({
                    transaction,
                    identifiers: [first.id, second.id],
                }),
            );
            const removed = await suite.transaction((transaction) =>
                suite.repository().profileService.purge({
                    transaction,
                    identifiers: [first.id, second.id, first.id],
                }),
            );
            expect(removed).toEqual({ message: "Profiles purged successfully" });
            expect(await suite.repository().repositories.profiles.findById({ id: first.id })).toBeNull();
            expect(await suite.repository().repositories.profiles.findById({ id: second.id })).toBeNull();
            expect(await suite.repository().repositories.profiles.findById({ id: other.id })).toEqual(other);
        });

        it("keeps the whole set when one identifier is missing", async () => {
            const entity = await create();
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().profileService.purge({
                        transaction,
                        identifiers: [entity.id, randomUUID()],
                    }),
                ),
            ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
            expect(await suite.repository().repositories.profiles.findById({ id: entity.id })).toEqual(entity);
        });
    });

    describe("revoke / restore", () => {
        it.each(["revoke", "restore"] as const)("uses one bulk update for 100 profiles on %s", async (operation) => {
            const entities = Array.from(
                { length: 100 },
                (_, index) => new Profile({ ...input(), name: `Profile ${index}` }),
            );
            await suite.prisma().profile.createMany({
                data: entities,
            });
            const identifiers = entities.map(({ id }) => id);
            if (operation === "restore") {
                await suite.transaction((transaction) =>
                    suite.repository().profileService.revoke({ transaction, identifiers }),
                );
            }
            const untouched = await suite.repository().repositories.profiles.findById({ id: profile.id });
            const result = await suite.transaction(async (transaction) => {
                const read = jest.spyOn(transaction.profile, "findMany");
                const update = jest.spyOn(transaction.profile, "update");
                const updateMany = jest.spyOn(transaction.profile, "updateMany");
                const changed = await suite
                    .repository()
                    .profileService[operation]({ transaction, identifiers: [...identifiers, identifiers[0]!] });
                expect(read).not.toHaveBeenCalled();
                expect(update).not.toHaveBeenCalled();
                expect(updateMany).toHaveBeenCalledTimes(1);
                return changed;
            });
            expect(result).toEqual({
                message: operation === "revoke" ? "Profiles revoked successfully" : "Profiles restored successfully",
            });
            const stored = await suite.repository().repositories.profiles.find({ where: { id: { in: identifiers } } });
            expect(stored).toHaveLength(100);
            expect(stored.every((entity) => entity.isRevoked === (operation === "revoke"))).toBe(true);
            expect(new Set(stored.map(({ updatedAt }) => updatedAt?.getTime())).size).toBe(1);
            expect(stored[0]?.updatedAt).toBeInstanceOf(Date);
            expect(await suite.repository().repositories.profiles.findById({ id: profile.id })).toEqual(untouched);
        });

        it("persists bulk transitions and preserves all data and creation metadata", async () => {
            const first = await create();
            const second = await create({ ...input(), name: "Second" });
            const identifiers = [first.id, second.id];
            const revoked = await suite.transaction((transaction) =>
                suite.repository().profileService.revoke({ transaction, identifiers }),
            );
            expect(revoked).toEqual({ message: "Profiles revoked successfully" });
            expect(await suite.repository().repositories.profiles.find({ where: { id: { in: identifiers } } })).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ ...first, isRevoked: true, updatedAt: expect.any(Date) }),
                    expect.objectContaining({ ...second, isRevoked: true, updatedAt: expect.any(Date) }),
                ]),
            );
            expect(await suite.repository().repositories.profiles.findById({ id: first.id })).toMatchObject({
                isRevoked: true,
            });
            const updated = await suite.transaction((transaction) =>
                suite.repository().profileService.update({
                    transaction,
                    id: first.id,
                    patch: { description: "Updated while revoked" },
                }),
            );
            expect(updated).toEqual({ message: "Profile updated successfully" });
            expect(await suite.repository().repositories.profiles.findById({ id: first.id })).toMatchObject({
                isRevoked: true,
            });
            const restored = await suite.transaction((transaction) =>
                suite.repository().profileService.restore({ transaction, identifiers }),
            );
            expect(restored).toEqual({ message: "Profiles restored successfully" });
            expect(
                (await suite.repository().repositories.profiles.find({ where: { id: { in: identifiers } } })).every(
                    (entity) => !entity.isRevoked,
                ),
            ).toBe(true);
            expect(await suite.repository().repositories.profiles.findById({ id: first.id })).toMatchObject({
                ...first,
                description: "Updated while revoked",
                updatedAt: expect.any(Date),
            });
        });

        it.each(["revoke", "restore"] as const)(
            "sets %s for mixed states and accepts repeated commands",
            async (operation) => {
                const active = await create();
                await suite.transaction((transaction) =>
                    suite.repository().profileService.revoke({ transaction, identifiers: [profile.id] }),
                );
                const revoked = await suite.repository().repositories.profiles.findById({ id: profile.id });
                const identifiers = [active.id, profile.id];
                const message = operation === "revoke" ? "Profiles revoked successfully" : "Profiles restored successfully";
                const change = async (): Promise<void> => {
                    await expect(
                        suite.transaction((transaction) =>
                            suite.repository().profileService[operation]({ transaction, identifiers }),
                        ),
                    ).resolves.toEqual({ message });
                    const stored = await suite
                        .repository()
                        .repositories.profiles.find({ where: { id: { in: identifiers } } });
                    expect(stored).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                ...active,
                                isRevoked: operation === "revoke",
                                updatedAt: expect.any(Date),
                            }),
                            expect.objectContaining({
                                ...revoked,
                                isRevoked: operation === "revoke",
                                updatedAt: expect.any(Date),
                            }),
                        ]),
                    );
                    expect(stored).toHaveLength(2);
                    expect(new Set(stored.map(({ updatedAt }) => updatedAt?.getTime())).size).toBe(1);
                };
                await change();
                await change();
            },
        );

        it.each(["revoke", "restore"] as const)("rejects %s with a missing record atomically", async (operation) => {
            const entity = await create();
            if (operation === "restore") {
                await suite.transaction((transaction) =>
                    suite.repository().profileService.revoke({ transaction, identifiers: [entity.id] }),
                );
            }
            const before = await suite.repository().repositories.profiles.findById({ id: entity.id });
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().profileService[operation]({
                        transaction,
                        identifiers: [entity.id, randomUUID()],
                    }),
                ),
            ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
            expect(await suite.repository().repositories.profiles.findById({ id: entity.id })).toEqual(before);
        });
    });

    it("refuses to purge a mixed set of active and revoked profiles", async () => {
        const active = await create();
        await suite.transaction((transaction) =>
            suite.repository().profileService.revoke({
                transaction,
                identifiers: [profile.id],
            }),
        );
        const revoked = await suite.repository().repositories.profiles.findById({ id: profile.id });
        await expect(
            suite.transaction((transaction) =>
                suite.repository().profileService.purge({
                    transaction,
                    identifiers: [active.id, profile.id],
                }),
            ),
        ).rejects.toMatchObject({ code: ErrorCode.INVARIANT_VIOLATION, message: "Cannot purge an active profile" });
        expect(await suite.repository().repositories.profiles.findById({ id: active.id })).toEqual(active);
        expect(await suite.repository().repositories.profiles.findById({ id: profile.id })).toEqual(revoked);
    });
    it("rolls back a persisted update when the transaction fails", async () => {
        const entity = await create();
        await expect(
            suite.transaction(async (transaction) => {
                await suite.repository().profileService.update({ transaction, id: entity.id, patch: { name: "Changed" } });
                throw Exception.conflict({ reason: "Force transaction rollback" });
            }),
        ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
        expect(await suite.repository().repositories.profiles.findById({ id: entity.id })).toEqual(entity);
    });
});
