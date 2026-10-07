import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("SuccessMessage")
export class SuccessMessageDTO implements MessageResult {
    @Field(() => String)
    declare public message: string;
}
