declare namespace Services.Skill {
    interface Contract {
        create: Create.Signature;
        update: Update.Signature;
        purge: Purge.Signature;
    }

    namespace Create {
        type Props = {
            transaction: ORM.Transaction;
            input: Entities.Skill.ConstructorProps;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Update {
        type Props = {
            transaction: ORM.Transaction;
            id: string;
            patch: Partial<Entities.Skill.MutableFields>;
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
}
