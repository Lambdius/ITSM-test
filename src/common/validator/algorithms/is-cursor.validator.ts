import { plainToInstance } from "class-transformer";
import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
    validateSync,
    isISO8601,
    maxLength,
    isBase64,
    isObject,
    isString,
    isArray,
    isUUID,
} from "class-validator";

import { CursorDTO } from "~common/dto/cursor.dto";

@ValidatorConstraint({ name: "IsCursor", async: false })
class IsCursorConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown, args: ValidationArguments): boolean {
        try {
            if (!isString(value) || !maxLength(value, 4096) || !isBase64(value, { urlSafe: true })) {
                return false;
            } else {
                const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
                if (isObject(parsed)) {
                    const cursor = plainToInstance(CursorDTO, parsed);
                    if (validateSync(cursor, { whitelist: true, forbidNonWhitelisted: true }).length) {
                        return false;
                    }
                    const { orderBy } = args.object as Validation.CursorRequest;
                    if (orderBy !== undefined && orderBy !== null && !isArray(orderBy)) {
                        return false;
                    }
                    const count = orderBy?.length ?? 1;
                    return (
                        cursor.values.length === count + 1 &&
                        isUUID(cursor.values[count]) &&
                        cursor.values
                            .slice(0, count)
                            .every((position) => isISO8601(position, { strict: true, strictSeparator: true }))
                    );
                } else {
                    return false;
                }
            }
        } catch {
            return false;
        }
    }

    public defaultMessage(): string {
        return "$property must be a base64url cursor of at most 4096 characters with version 1, a SHA-256 scope, one ISO date per sort field and a final UUID";
    }
}

export function IsCursor(options?: ValidationOptions): PropertyDecorator {
    return (target, propertyName) => {
        registerDecorator({
            name: "IsCursor",
            target: target.constructor,
            propertyName: propertyName.toString(),
            validator: IsCursorConstraint,
            options,
        });
    };
}
