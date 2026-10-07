import { INestApplication, ValidationError, ValidationPipe } from "@nestjs/common";

import { Exception } from "~common/exceptions";

export abstract class BootstrapPipes {
    public static applyGlobalPipes(application: INestApplication): void {
        application.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
                forbidNonWhitelisted: true,
                validationError: { target: false, value: false },
                exceptionFactory: (errors: ValidationError[]) => {
                    return Exception.badRequest(this.formatValidationErrors(errors));
                },
            }),
        );
    }

    private static formatValidationErrors(errors: ValidationError[]): Exceptions.ValidationDetail[] {
        const results: Exceptions.ValidationDetail[] = [];
        const collect = (error: ValidationError, parentPath = ""): void => {
            const path = parentPath ? `${parentPath}.${error.property}` : error.property;
            if (error.constraints) {
                results.push({ path, messages: Object.values(error.constraints) });
            }
            for (const child of error.children ?? []) {
                collect(child, path);
            }
        };
        for (const error of errors) {
            collect(error);
        }
        return results;
    }
}
