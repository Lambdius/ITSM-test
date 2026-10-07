import { PostgresResource } from "./postgres.resource";

export default async function teardown(): Promise<void> {
    await PostgresResource.stop();
}
