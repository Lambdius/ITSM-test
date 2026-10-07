import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

import { profiles, profileSkills, experiences, projects } from "./datasets";
import { seed } from "./seeder";

describe("seed (PostgreSQL)", () => {
    const suite = postgresSuite({
        repository: ({ prisma }) => prisma,
        fixture: (prisma) => new CoreFixture(prisma),
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    async function snapshot(): Promise<Integration.Seed.Snapshot> {
        return {
            profiles: await suite.prisma().profile.findMany({ orderBy: { id: "asc" } }),
            profileSkills: await suite.prisma().profileSkill.findMany({ orderBy: { id: "asc" } }),
            experiences: await suite.prisma().experience.findMany({ orderBy: { id: "asc" } }),
            projects: await suite.prisma().project.findMany({ orderBy: { id: "asc" } }),
        };
    }

    it("inserts every dataset with one bulk operation and preserves its values and relations", async () => {
        const inserts = [
            jest.spyOn(suite.prisma().profile, "createMany"),
            jest.spyOn(suite.prisma().profileSkill, "createMany"),
            jest.spyOn(suite.prisma().experience, "createMany"),
            jest.spyOn(suite.prisma().project, "createMany"),
        ];
        await expect(seed(suite.prisma())).resolves.toBeUndefined();
        for (const insert of inserts) {
            expect(insert).toHaveBeenCalledTimes(1);
        }
        expect(await snapshot()).toEqual({ profiles, profileSkills, experiences, projects });
    });

    it("clears all application tables before restoring the datasets", async () => {
        await seed(suite.prisma());
        const profile = await suite.prisma().profile.findFirstOrThrow();
        await suite.prisma().profile.update({
            where: { id: profile.id },
            data: { name: "Renamed", description: "Edited", isRevoked: true, updatedAt: new Date("2026-02-01") },
        });
        await suite.prisma().profile.create({ data: { ...profile, id: randomUUID(), name: "Other" } });
        await suite.prisma().profileSkill.create({
            data: { id: randomUUID(), profile: profile.id, name: "Additional", createdAt: new Date() },
        });
        await suite.prisma().experience.updateMany({ data: { achievements: "Edited" } });
        await suite.prisma().project.updateMany({ data: { name: "Edited" } });
        await seed(suite.prisma());
        expect(await snapshot()).toEqual({ profiles, profileSkills, experiences, projects });
    });

    it("runs through the configured Prisma seed entry point", async () => {
        execFileSync("pnpm", ["exec", "prisma", "db", "seed"], {
            env: process.env,
            stdio: "pipe",
            timeout: 60_000,
        });
        expect(await snapshot()).toEqual({ profiles, profileSkills, experiences, projects });
    });
});
