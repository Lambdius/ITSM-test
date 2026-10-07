declare namespace Services.Profile {
    interface Contract {
        restore: Restore.Signature;
        revoke: Revoke.Signature;
        create: Create.Signature;
        update: Update.Signature;
        purge: Purge.Signature;
    }

    namespace Create {
        type Props = {
            transaction: ORM.Transaction;
            input: Entities.Profile.ConstructorProps;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Update {
        type Props = {
            transaction: ORM.Transaction;
            id: string;
            patch: Partial<Entities.Profile.MutableFields>;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Purge {
        type Props = {
            transaction: ORM.Transaction;
            identifiers: string[];
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Revoke {
        type Props = {
            transaction: ORM.Transaction;
            identifiers: string[];
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Restore {
        type Props = {
            transaction: ORM.Transaction;
            identifiers: string[];
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }
}
