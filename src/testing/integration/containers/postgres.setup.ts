import { PostgresResource } from "./postgres.resource";

export default async function setup(): Promise<void> {
    const postgres = await PostgresResource.start();
    await postgres.close();
}
