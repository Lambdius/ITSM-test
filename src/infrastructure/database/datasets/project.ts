import { Prisma } from "../generated/client";

export const projects: Prisma.ProjectCreateManyInput[] = [
    {
        id: "00000000-0000-4000-8000-000000000301",
        createdAt: new Date("2026-10-06T00:00:00.000Z"),
        updatedAt: null,
        name: "MonadIAM",
        url: "https://github.com/MonadIAM",
        profile: "00000000-0000-4000-8000-000000000001",
    },
];
