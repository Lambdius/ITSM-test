import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    registerDecorator,
    ValidationOptions,
    arrayMaxSize,
    arrayMinSize,
    isNumber,
    isArray,
    isDate,
} from "class-validator";

import { PublicStringOperator, PublicOrdinalOperator } from "~infrastructure/database/enums";

@ValidatorConstraint({ name: "IsFilterValue", async: false })
class IsFilterValueConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown, args: ValidationArguments): boolean {
        if (!isArray(value)) {
            return false;
        }
        const predicate = "predicate" in args.object ? args.object.predicate : undefined;
        switch (predicate) {
            case PublicStringOperator.IN:
            case PublicStringOperator.NOT_IN:
                return arrayMinSize(value, 1) && arrayMaxSize(value, 100);
            case PublicOrdinalOperator.IS_NULL:
            case PublicOrdinalOperator.IS_NOT_NULL:
                return arrayMaxSize(value, 0);
            case PublicOrdinalOperator.BETWEEN:
                if (value.length !== 2) {
                    return false;
                }
                const [start, end]: unknown[] = value;
                if (typeof start === "number" && typeof end === "number") {
                    return isNumber(start) && isNumber(end) && start <= end;
                }
                return start instanceof Date && end instanceof Date && isDate(start) && isDate(end) && start <= end;
            default:
                return value.length === 1;
        }
    }

    public defaultMessage(args: ValidationArguments): string {
        const predicate = "predicate" in args.object ? args.object.predicate : undefined;
        switch (predicate) {
            case PublicStringOperator.IN:
            case PublicStringOperator.NOT_IN:
                return `${predicate} requires between 1 and 100 values`;
            case PublicOrdinalOperator.IS_NULL:
            case PublicOrdinalOperator.IS_NOT_NULL:
                return `${predicate} requires an empty value list`;
            case PublicOrdinalOperator.BETWEEN:
                return "BETWEEN requires two numbers or two dates in ascending order, with inclusive bounds";
            default:
                return `${predicate} requires exactly one value`;
        }
    }
}

export function IsFilterValue(options?: ValidationOptions): PropertyDecorator {
    return (target, propertyName) => {
        registerDecorator({
            name: "IsFilterValue",
            target: target.constructor,
            propertyName: propertyName.toString(),
            validator: IsFilterValueConstraint,
            options,
        });
    };
}
