import { describe, expect, it } from "@jest/globals";

import { QueryOrder } from "~infrastructure/database/enums";

import { CursorPagination } from "./cursor-pagination";

describe("CursorPagination", () => {
    it("continues a mixed sort using source fields omitted from the mapped node", () => {
        const order: ORM.Utils.Pagination.Order<"occurredAt" | "label" | "id">[] = [
            { field: "occurredAt", direction: QueryOrder.DESC },
            { field: "label", direction: QueryOrder.ASC },
            { field: "id", direction: QueryOrder.ASC },
        ];
        const setup = { resource: "events", first: 1, filter: {}, order };
        const page = new CursorPagination(setup);
        const connection = page.connection({
            rows: [
                { id: "a", occurredAt: new Date("2024-01-01"), label: "Alpha" },
                { id: "b", occurredAt: new Date("2024-01-01"), label: "Alpha" },
            ],
            map: (row) => ({ id: row.id }),
        });
        expect(connection.edges.map(({ node }) => node)).toEqual([{ id: "a" }]);
        expect(connection.pageInfo.hasNextPage).toBe(true);

        const next = new CursorPagination({ ...setup, after: connection.pageInfo.endCursor });
        expect(next.where).toEqual({
            OR: [
                { occurredAt: { lt: "2024-01-01T00:00:00.000Z" } },
                { occurredAt: { equals: "2024-01-01T00:00:00.000Z" }, label: { gt: "Alpha" } },
                { occurredAt: { equals: "2024-01-01T00:00:00.000Z" }, label: { equals: "Alpha" }, id: { gt: "a" } },
            ],
        });
    });
});
