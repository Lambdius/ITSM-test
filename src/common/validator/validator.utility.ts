import { IsNonNullableFilter } from "./algorithms/is-non-nullable-filter.validator";
import { StandardValidationDecorators } from "./default-validator.utility";
import { IsFilterValue } from "./algorithms/is-filter-value.validator";
import { IsMsString } from "./algorithms/is-ms-string.validator";
import { IsOrigins } from "./algorithms/is-origins.validator";
import { IsCursor } from "./algorithms/is-cursor.validator";

export abstract class Validator extends StandardValidationDecorators {
    public static readonly IsNonNullableFilter = IsNonNullableFilter;
    public static readonly IsFilterValue = IsFilterValue;
    public static readonly IsMsString = IsMsString;
    public static readonly IsOrigins = IsOrigins;
    public static readonly IsCursor = IsCursor;

    private static compose(...decorators: PropertyDecorator[]): PropertyDecorator {
        return function applyComposedDecorator(target: object, propertyKey: string | symbol): void {
            for (const decorator of decorators) {
                decorator(target, propertyKey);
            }
        };
    }

    public static IsPositiveInt(): PropertyDecorator {
        return this.compose(this.IsInt(), this.IsPositive());
    }

    public static IsNonEmptyString(max: number): PropertyDecorator {
        return this.compose(this.IsString(), this.IsNotEmpty(), this.MaxLength(max));
    }

    public static IsUUIDArray(): PropertyDecorator {
        return this.compose(
            this.IsArray(),
            this.ArrayMinSize(1),
            this.ArrayMaxSize(100),
            this.IsUniqueArray(),
            this.IsUUID("4", { each: true }),
        );
    }

    public static IsHttpUrl(): PropertyDecorator {
        return this.compose(this.IsUrl({ protocols: ["http", "https"], require_protocol: true }), this.MaxLength(2048));
    }

    public static IsUndefinable(): PropertyDecorator {
        return this.ValidateIf((_object: object, value: unknown) => value !== undefined);
    }

    public static IsNullable(): PropertyDecorator {
        return this.ValidateIf((_object: object, value: unknown) => value !== null);
    }
}
