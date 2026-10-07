import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";

import { PublicOrdinalOperator } from "~infrastructure/database/enums";

@ValidatorConstraint({ name: "IsNonNullableFilter", async: false })
class IsNonNullableFilterConstraint implements ValidatorConstraintInterface {
    public validate(value: Validation.Filter): boolean {
        return value.predicate !== PublicOrdinalOperator.IS_NULL && value.predicate !== PublicOrdinalOperator.IS_NOT_NULL;
    }

    public defaultMessage(args: ValidationArguments): string {
        return `${args.property} is not nullable and does not support IS_NULL or IS_NOT_NULL`;
    }
}

export function IsNonNullableFilter(options?: ValidationOptions): PropertyDecorator {
    return (target, propertyName) => {
        registerDecorator({
            name: "IsNonNullableFilter",
            target: target.constructor,
            propertyName: propertyName.toString(),
            validator: IsNonNullableFilterConstraint,
            options,
        });
    };
}
