import { createHash } from "node:crypto";

import { QueryOrder } from "~infrastructure/database/enums";
import { Exception } from "~common/exceptions";

export class CursorPagination<Field extends string> {
    private readonly scope: Optional<string>;

    public readonly where: { OR?: ORM.Utils.Pagination.Condition[] };
    public readonly orderBy: Record<string, QueryOrder>[];
    public readonly first: number;

    public constructor(private readonly props: ORM.Utils.Pagination.Setup<Field>) {
        this.first = props.first ?? 20;

        this.scope = props.filter
            ? createHash("sha256")
                  .update(
                      JSON.stringify({
                          resource: props.resource,
                          filter: props.filter,
                          order: props.order,
                      }),
                  )
                  .digest("hex")
            : undefined;

        this.orderBy = props.order.map(({ field, direction }) => ({ [field]: direction }));
        this.where = {};

        if (props.after) {
            const cursor = JSON.parse(
                Buffer.from(props.after, "base64url").toString("utf8"),
            ) as ORM.Utils.Pagination.Cursor;

            if (this.scope === undefined || cursor.scope === this.scope) {
                const values = cursor.values;
                const conditions: ORM.Utils.Pagination.Condition[] = [];
                const equalities: ORM.Utils.Pagination.Condition = {};

                for (const [index, column] of props.order.entries()) {
                    const operator = column.direction === QueryOrder.ASC ? "gt" : "lt";
                    const value = values[index];

                    conditions.push({ ...equalities, [column.field]: { [operator]: value } });
                    equalities[column.field] = { equals: value };
                }

                this.where = { OR: conditions };
            } else {
                throw Exception.badRequest([
                    {
                        path: "after",
                        messages: [
                            "Cursor belongs to a different entity, filter, sort order or parent profile; request the first page again",
                        ],
                    },
                ]);
            }
        }
    }

    public bind(filter: unknown): CursorPagination<Field> {
        return new CursorPagination({ ...this.props, filter });
    }

    public connection<Row extends Record<Field, ORM.Utils.Pagination.Value>, Node>(
        props: ORM.Utils.Pagination.ConnectionProps<Row, Node>,
    ): ORM.Utils.Pagination.Connection<Node> {
        const { rows, map } = props;
        if (this.scope === undefined) {
            throw Exception.internal({ operation: "connection", reason: "Pagination filter has not been bound" });
        }
        const edges: ORM.Utils.Pagination.Edge<Node>[] = [];

        for (const row of rows) {
            if (edges.length >= this.first) {
                break;
            } else {
                const node = map(row);
                const values: string[] = [];

                for (const { field } of this.props.order) {
                    const value = row[field];
                    values.push(value instanceof Date ? value.toISOString() : value);
                }

                const cursor = Buffer.from(JSON.stringify({ version: 1, scope: this.scope, values })).toString("base64url");
                edges.push({ node, cursor });
            }
        }

        return {
            edges,
            pageInfo: {
                startCursor: edges[0]?.cursor ?? null,
                endCursor: edges[edges.length - 1]?.cursor ?? null,
                hasNextPage: rows.length > this.first,
                hasPreviousPage: false,
            },
        };
    }
}
