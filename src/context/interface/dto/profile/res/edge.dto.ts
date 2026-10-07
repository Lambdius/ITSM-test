import { Field, ObjectType } from "@nestjs/graphql";

import { ProfileDTO } from "./entity.dto";

@ObjectType("ProfileEdge")
export class ProfileEdgeDTO implements ORM.Utils.Pagination.Edge<Entities.Profile.Data> {
    @Field(() => String)
    declare public cursor: string;

    @Field(() => ProfileDTO)
    declare public node: Entities.Profile.Data;
}
