import { GraphQLResolveInfo, FieldNode, GraphQLObjectType, GraphQLNamedType, getNamedType, isObjectType } from "graphql";
import { collectSubfields } from "graphql/execution/collectFields";
import { getArgumentValues } from "graphql/execution/values";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { CursorPagination, ORMAdapter } from "~infrastructure/database/utils";
import { PublicLinkOperator } from "~infrastructure/database/enums";
import { Exception } from "~common/exceptions";

export class Population<E extends object, A extends Repositories.Mappers.Meta> {
    private static readonly loaded = new WeakMap<object, Map<string, unknown>>();
    private readonly mapper: Repositories.Mappers.Contract<A["Where"], A>;

    public constructor(private readonly definition: Repositories.Population.Definition<E, A>) {
        this.mapper = new definition.Mapper();
    }

    public static get<E extends Repositories.Population.Entity, K extends keyof Repositories.Population.Loaded<E> & string>(
        entity: E,
        relation: K,
    ): Optional<Repositories.Population.Loaded<E>[K]> {
        return this.loaded.get(entity)?.get(relation) as Optional<Repositories.Population.Loaded<E>[K]>;
    }

    public fromGraphQL(info: GraphQLResolveInfo): A["Populate"] {
        const type = getNamedType(info.returnType);
        return this.fromFields(info, Population.unwrap(info, Population.collect(info, type, info.fieldNodes)));
    }

    public build(props: A["Populate"]): Repositories.Population.Plan<E> {
        const relations: Record<string, Repositories.Population.PreparedRelation> = {};
        const available = this.definition.relations();
        for (const name in props) {
            const value = props[name];
            const relation = available[name];
            if (Object.prototype.hasOwnProperty.call(props, name) && relation && value) {
                relations[name] = relation.foreignKey
                    ? relation.target.collection(value, relation.foreignKey)
                    : relation.target.single(value);
            }
        }
        return {
            include: Object.fromEntries(Object.entries(relations).map(([name, relation]) => [name, relation.query])),
            hydrate: (row) => {
                const data: Repositories.Population.Data<E> & UnknownObject = { ...row };
                const loaded = new Map<string, unknown>();
                for (const [name, relation] of Object.entries(relations)) {
                    loaded.set(name, relation.read(data[name], row));
                    delete data[name];
                }
                const entity = ORMAdapter.hydrate(this.definition.Entity, data);
                Population.loaded.set(entity, loaded);
                return entity;
            },
        };
    }

    private single(props: A["Populate"]): Repositories.Population.PreparedRelation {
        const plan = this.build(props);
        return {
            query: { include: plan.include },
            read: (row) => (row === null ? null : plan.hydrate(row as Repositories.Population.Data<E>)),
        };
    }

    private collection(props: Repositories.Base.FindMany<A>, foreignKey: string): Repositories.Population.PreparedRelation {
        const plan = this.build(props.populate ?? {});
        const where = this.mapper.buildWhereORM({ ...props.filter, [foreignKey]: undefined });
        const page = new CursorPagination({
            resource: this.definition.resource,
            first: props.first,
            after: props.after,
            order: this.mapper.buildOptionsORM(props.orderBy).orderBy,
        });
        return {
            query: {
                where: { AND: [where, page.where] },
                orderBy: page.orderBy,
                take: page.first + 1,
                include: plan.include,
            },
            read: (value, parent) => {
                const filter = this.mapper.buildWhereORM({
                    ...props.filter,
                    [foreignKey]: {
                        predicate: PublicLinkOperator.EQUAL,
                        value: [parent.id],
                    },
                });
                return page.bind(filter).connection({
                    rows: value as Repositories.Population.Row<E, A>[],
                    map: (row) => plan.hydrate(row),
                });
            },
        };
    }

    private fromFields(info: GraphQLResolveInfo, fields: Repositories.Population.Fields): A["Populate"] {
        const result: Record<string, object> = {};
        for (const [name, relation] of Object.entries(this.definition.relations())) {
            const nodes = fields.fields.get(name);
            if (nodes?.length && relation) {
                const children = Population.unwrap(info, Population.descend(info, fields.type, nodes));
                if (relation.foreignKey) {
                    const args = relation.target.arguments(info, fields.type, nodes);
                    if (args) {
                        result[name] = { ...args, populate: relation.target.fromFields(info, children) };
                    }
                } else {
                    result[name] = relation.target.fromFields(info, children);
                }
            }
        }
        return result as A["Populate"];
    }

    private arguments(
        info: GraphQLResolveInfo,
        type: GraphQLObjectType,
        nodes: readonly FieldNode[],
    ): Optional<Repositories.Base.FindMany<A>> {
        const field = type.getFields()[nodes[0]!.name.value]!;
        const args: UnknownObject[] = nodes.map((node) => getArgumentValues(field, node, info.variableValues));
        const signature = JSON.stringify(args[0]);
        if (args.some((value) => JSON.stringify(value) !== signature)) {
            return undefined;
        }
        const input = plainToInstance(this.definition.DTO, args[0]);
        return validateSync(input).length > 0 ? undefined : input;
    }

    private static unwrap(
        info: GraphQLResolveInfo,
        fields: Repositories.Population.Fields,
    ): Repositories.Population.Fields {
        const edges = fields.fields.get("edges");
        if (edges) {
            const edgeFields = this.descend(info, fields.type, edges);
            const nodes = edgeFields.fields.get("node");
            if (nodes) {
                return this.descend(info, edgeFields.type, nodes);
            }
        }
        return fields;
    }

    private static descend(
        info: GraphQLResolveInfo,
        parent: GraphQLObjectType,
        nodes: readonly FieldNode[],
    ): Repositories.Population.Fields {
        const type = getNamedType(parent.getFields()[nodes[0]!.name.value]!.type);
        return this.collect(info, type, nodes);
    }

    private static collect(
        info: GraphQLResolveInfo,
        type: GraphQLNamedType,
        nodes: readonly FieldNode[],
    ): Repositories.Population.Fields {
        const fields = new Map<string, FieldNode[]>();
        if (!isObjectType(type)) {
            throw Exception.internal({ operation: "populate", reason: "Expected a GraphQL object type", type: type.name });
        }
        const selections = collectSubfields(info.schema, info.fragments, info.variableValues, type, nodes);
        for (const selection of selections.values()) {
            const name = selection[0]!.name.value;
            fields.set(name, [...(fields.get(name) ?? []), ...selection]);
        }
        return { type, fields };
    }
}
