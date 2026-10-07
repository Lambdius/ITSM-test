import {
    registerDecorator,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationOptions,
    isURL,
} from "class-validator";

@ValidatorConstraint({ name: "IsOrigins", async: false })
class IsOriginsConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown): boolean {
        if (typeof value !== "string") {
            return false;
        }
        try {
            const origins: unknown = JSON.parse(value);
            return (
                Array.isArray(origins) &&
                origins.every(
                    (origin: unknown) =>
                        typeof origin === "string" &&
                        isURL(origin, { protocols: ["http", "https"], require_protocol: true, require_tld: false }) &&
                        new URL(origin).origin === origin,
                )
            );
        } catch {
            return false;
        }
    }

    public defaultMessage(): string {
        return "Expected a JSON array of HTTP(S) origins without paths, credentials or trailing slashes";
    }
}

export function IsOrigins(options?: ValidationOptions): PropertyDecorator {
    return (target, propertyName) => {
        registerDecorator({
            name: "IsOrigins",
            target: target.constructor,
            propertyName: propertyName.toString(),
            validator: IsOriginsConstraint,
            options,
        });
    };
}
