declare namespace Validation {
    type CursorRequest = {
        orderBy?: Nullable<ORM.Utils.Pagination.Order[]>;
    };

    type Filter = {
        predicate: string;
    };
}
