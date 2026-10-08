import { PublicOrdinalOperator, QueryOrder, PublicStringOperator } from "~infrastructure/database/enums";
import { StringFilterDTO, LinkFilterDTO, OrdinalFilterDTO } from "~common/dto";
import { Exception } from "~common/exceptions";

export class ORMAdapter {
    public static hydrate<T extends object>(entity: ORM.EntityClass<T>, data: ORM.EntityData<T>): T {
        return Object.assign(Object.create(entity.prototype) as T, data);
    }

    public static applyStringFilter(filter: StringFilterDTO | LinkFilterDTO): ORM.OperatorMap<string> {
        if (filter.predicate === PublicStringOperator.IN) {
            return { in: filter.value };
        }
        if (filter.predicate === PublicStringOperator.NOT_IN) {
            return { notIn: filter.value };
        }

        const value = filter.value[0]!;
        const literal = value.replace(/[\\%_]/g, "\\$&");

        switch (filter.predicate) {
            case PublicStringOperator.EQUAL:
                return { equals: value };
            case PublicStringOperator.NOT_EQUAL:
                return { not: value };
            case PublicStringOperator.LIKE:
                return { contains: literal };
            case PublicStringOperator.ILIKE:
                return { contains: literal, mode: "insensitive" };
            default:
                throw Exception.internal({ operation: "applyStringFilter", predicate: filter.predicate });
        }
    }

    public static applyOrdinalFilter<T extends Ordinal>(filter: OrdinalFilterDTO<T>): ORM.OperatorMap<T> {
        const { predicate, value } = filter;
        const first = value[0]!;
        switch (predicate) {
            case PublicOrdinalOperator.EQUAL:
                return { equals: first };
            case PublicOrdinalOperator.NOT_EQUAL:
                return { not: first };
            case PublicOrdinalOperator.GREATER_THAN:
                return { gt: first };
            case PublicOrdinalOperator.GREATER_OR_EQUAL:
                return { gte: first };
            case PublicOrdinalOperator.LESS_THAN:
                return { lt: first };
            case PublicOrdinalOperator.LESS_OR_EQUAL:
                return { lte: first };
            case PublicOrdinalOperator.BETWEEN:
                return { gte: first, lte: value[1]! };
            default:
                throw Exception.internal({ operation: "applyOrdinalFilter", predicate });
        }
    }

    public static applyNullableOrdinalFilter<T extends Ordinal>(filter: OrdinalFilterDTO<T>): ORM.OperatorMap<Nullable<T>> {
        switch (filter.predicate) {
            case PublicOrdinalOperator.IS_NULL:
                return { equals: null };
            case PublicOrdinalOperator.IS_NOT_NULL:
                return { not: null };
            default:
                return this.applyOrdinalFilter(filter);
        }
    }

    public static applyNullableStringFilter(filter: StringFilterDTO | LinkFilterDTO): ORM.OperatorMap<Nullable<string>> {
        switch (filter.predicate) {
            case PublicStringOperator.IS_NULL:
                return { equals: null };
            case PublicStringOperator.IS_NOT_NULL:
                return { not: null };
            default:
                return this.applyStringFilter(filter);
        }
    }

    public static orderBy<Field extends string>(
        order: Maybe<ORM.Utils.Pagination.Order<Field>[]>,
        fallback: Field,
        direction = QueryOrder.ASC,
    ): ORM.Utils.Pagination.Column<Field | "id">[] {
        const columns = order ?? [{ field: fallback, direction }];
        const stable: ORM.Utils.Pagination.Order<Field | "id">[] = columns.some(({ field }) => field === "id")
            ? columns
            : [...columns, { field: "id", direction: QueryOrder.ASC }];
        return stable.map((column) => ({ ...column, date: column.field === "createdAt" || column.field === "startDate" }));
    }
}
