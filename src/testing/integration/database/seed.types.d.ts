declare namespace Integration.Seed {
    type Snapshot = {
        profileSkills: Awaited<ReturnType<ORM.Transaction["profileSkill"]["findMany"]>>;
        experiences: Awaited<ReturnType<ORM.Transaction["experience"]["findMany"]>>;
        profiles: Awaited<ReturnType<ORM.Transaction["profile"]["findMany"]>>;
        projects: Awaited<ReturnType<ORM.Transaction["project"]["findMany"]>>;
    };
}
