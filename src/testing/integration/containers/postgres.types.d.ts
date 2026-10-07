import { DatabaseService } from "~infrastructure/database";

declare global {
    namespace Integration.Postgres {
        namespace Resource {
            interface Contract {
                prisma: DatabaseService;
                reset: Reset.Signature;
                close: Close.Signature;
            }

            namespace Reset {
                type Result = Promise<void>;

                type Signature = () => Result;
            }

            namespace Close {
                type Result = Promise<void>;

                type Signature = () => Result;
            }
        }

        namespace Suite {
            type Setup<Repository, Fixture> = {
                repository: RepositoryFactory<Repository>;
                fixture: FixtureFactory<Fixture>;
            };

            type FactoryContext = {
                prisma: DatabaseService;
            };

            type Contract<Repository, Fixture> = {
                repository: RepositoryAccessor.Signature<Repository>;
                fixtures: FixtureAccessor.Signature<Fixture>;
                transaction: Transaction.Signature;
                prisma(): DatabaseService;
            };

            type FixtureFactory<Fixture> = (prisma: DatabaseService) => Fixture;

            type RepositoryFactory<Repository> = (context: FactoryContext) => Repository;

            namespace RepositoryAccessor {
                type Result<Repository> = Repository;

                type Signature<Repository> = () => Result<Repository>;
            }

            namespace FixtureAccessor {
                type Result<Fixture> = Fixture;

                type Signature<Fixture> = () => Result<Fixture>;
            }

            namespace Transaction {
                type Callback<Result> = (transaction: ORM.Transaction) => Promise<Result>;

                type Result<Value> = Promise<Value>;

                type Signature = <Result>(callback: Callback<Result>) => Promise<Result>;
            }
        }
    }
}
