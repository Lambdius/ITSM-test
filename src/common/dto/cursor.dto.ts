import { StandardValidationDecorators } from "~common/validator/default-validator.utility";

export class CursorDTO implements ORM.Utils.Pagination.Cursor {
    @StandardValidationDecorators.Equals(1)
    declare public version: number;

    @StandardValidationDecorators.IsString()
    @StandardValidationDecorators.IsHash("sha256")
    declare public scope: string;

    @StandardValidationDecorators.IsArray()
    @StandardValidationDecorators.ArrayMinSize(2)
    @StandardValidationDecorators.ArrayMaxSize(3)
    @StandardValidationDecorators.IsString({ each: true })
    declare public values: string[];
}
