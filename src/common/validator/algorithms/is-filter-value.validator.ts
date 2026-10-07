import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    registerDecorator,
    ValidationOptions,
    arrayMaxSize,
    arrayMinSize,
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
        const { predicate } = args.object as Validation.Filter;
        switch (predicate) {
            case PublicStringOperator.IN:
            case PublicStringOperator.NOT_IN:
                return arrayMinSize(value, 1) && arrayMaxSize(value, 100);
            case PublicOrdinalOperator.IS_NULL:
            case PublicOrdinalOperator.IS_NOT_NULL:
                return arrayMaxSize(value, 0);
            case PublicOrdinalOperator.BETWEEN:
                return value.length === 2 && isDate(value[0]) && isDate(value[1]) && value[0] <= value[1];
            default:
                return value.length === 1;
        }
    }

    public defaultMessage(args: ValidationArguments): string {
        const { predicate } = args.object as Validation.Filter;
        switch (predicate) {
            case PublicStringOperator.IN:
            case PublicStringOperator.NOT_IN:
                return `${predicate} requires between 1 and 100 values`;
            case PublicOrdinalOperator.IS_NULL:
            case PublicOrdinalOperator.IS_NOT_NULL:
                return `${predicate} requires an empty value list`;
            case PublicOrdinalOperator.BETWEEN:
                return "BETWEEN requires two valid dates in ascending order, with inclusive bounds";
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
