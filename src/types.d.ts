type Nullable<T> = T | null;

type Optional<T> = T | undefined;

type Maybe<T> = T | null | undefined;

type Ordinal = number | string | Date;

type UnknownObject = Record<string, unknown>;

type MessageResult = {
    message: string;
};
