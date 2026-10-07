import { afterAll, beforeAll, beforeEach } from "@jest/globals";

import { ProfileFixture } from "~testing/integration/repositories/profile.fixture";
import { Exception } from "~common/exceptions";

import { GraphQLResource } from "./graphql.resource";
import { postgresSuite } from "./postgres.suite";

export function graphqlSuite(): Integration.GraphQL.Suite.Contract {
    const postgres = postgresSuite({
        repository: ({ prisma }) => prisma,
        fixture: (prisma) => new ProfileFixture(prisma),
    });

    let application: Optional<GraphQLResource>;
    let profile: Optional<string>;

    beforeAll(async () => {
        application = await GraphQLResource.connect();
    });

    beforeEach(async () => {
        profile = (await postgres.fixtures().presentationScenario()).id;
    });

    afterAll(async () => {
        await application?.close();
    });

    return {
        prisma: postgres.prisma,
        application: () => {
            if (application) {
                return application;
            } else {
                throw Exception.internal({ reason: "GraphQL test resource is not started" });
            }
        },
        profile: () => {
            if (profile) {
                return profile;
            } else {
                throw Exception.internal({ reason: "GraphQL test profile is not initialized" });
            }
        },
    };
}
