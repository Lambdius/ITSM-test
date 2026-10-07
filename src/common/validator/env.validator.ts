import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { EnvironmentVariablesDTO } from "~common/dto/env.dto";
import { Exception } from "~common/exceptions";

export function validateEnv(config: UnknownObject): EnvironmentVariablesDTO {
    const validated = plainToInstance(EnvironmentVariablesDTO, config, { enableImplicitConversion: false });
    const errors = validateSync(validated, {
        skipMissingProperties: false,
        whitelist: true,
        validationError: { target: false, value: false },
    });
    if (errors.length) {
        const details = errors.map(({ property, constraints }) => ({
            path: property,
            messages: Object.values(constraints ?? {}),
        }));
        throw Exception.badRequest(details, "Invalid environment configuration");
    }
    return validated;
}
