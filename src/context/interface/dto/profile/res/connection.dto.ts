import { Field, ObjectType } from "@nestjs/graphql";

import { PageInfoDTO } from "~common/dto";

import { ProfileEdgeDTO } from "./edge.dto";

@ObjectType("ProfileConnection")
export class ProfileConnectionDTO implements ORM.Utils.Pagination.Connection<Entities.Profile.Data> {
    @Field(() => [ProfileEdgeDTO])
    declare public edges: ProfileEdgeDTO[];

    @Field(() => PageInfoDTO)
    declare public pageInfo: PageInfoDTO;
}
