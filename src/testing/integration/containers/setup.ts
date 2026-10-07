import { APPLICATION_ENV } from "./graphql.constants";
import setupPostgres from "./postgres.setup";

export default async function setup(): Promise<void> {
    Object.assign(process.env, APPLICATION_ENV);
    await setupPostgres();
}
