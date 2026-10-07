import { profiles, profileSkills, experiences, projects } from "./datasets";
import { PrismaClient } from "./generated/client";

export async function seed(prisma: PrismaClient): Promise<void> {
    await prisma.$transaction([
        prisma.profileSkill.deleteMany(),
        prisma.experience.deleteMany(),
        prisma.project.deleteMany(),
        prisma.profile.deleteMany(),
        prisma.profile.createMany({ data: profiles }),
        prisma.profileSkill.createMany({ data: profileSkills }),
        prisma.experience.createMany({ data: experiences }),
        prisma.project.createMany({ data: projects }),
    ]);
}
