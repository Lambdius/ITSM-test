import { beforeAll, beforeEach, afterAll } from "@jest/globals";

import { Exception } from "~common/exceptions";

import { PostgresResource } from "./postgres.resource";

export function postgresSuite<Repository, Fixture>(
    setup: Integration.Postgres.Suite.Setup<Repository, Fixture>,
): Integration.Postgres.Suite.Contract<Repository, Fixture> {
    let postgres: Optional<PostgresResource>;
    let repository: Optional<Repository>;
    let fixtures: Optional<Fixture>;

    beforeAll(async () => {
        postgres = await PostgresResource.connect();
    });

    beforeEach(async () => {
        const resource = requirePostgres(postgres);

        await resource.reset();
        repository = setup.repository({ prisma: resource.prisma });
        fixtures = setup.fixture(resource.prisma);
    });

    afterAll(async () => {
        await postgres?.close();
    });

    return {
        transaction: async (callback) => await requirePostgres(postgres).prisma.transaction(callback),
        prisma: () => requirePostgres(postgres).prisma,
        repository: () => requireRepository(repository),
        fixtures: () => requireFixtures(fixtures),
    };
}

function requirePostgres(postgres: Optional<PostgresResource>): PostgresResource {
    if (postgres) {
        return postgres;
    } else {
        throw Exception.internal({ reason: "Postgres test resource is not started" });
    }
}

function requireRepository<Repository>(repository: Optional<Repository>): Repository {
    if (repository) {
        return repository;
    } else {
        throw Exception.internal({ reason: "Integration test repository is not initialized" });
    }
}

function requireFixtures<Fixture>(fixtures: Optional<Fixture>): Fixture {
    if (fixtures) {
        return fixtures;
    } else {
        throw Exception.internal({ reason: "Integration test fixtures are not initialized" });
    }
}
