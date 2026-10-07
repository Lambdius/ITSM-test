import { Type } from "class-transformer";
import ms from "ms";

import { Validator } from "~common/validator";
import { NodeEnv } from "~common/enums";

export class EnvironmentVariablesDTO {
    @Validator.IsEnum(NodeEnv)
    declare public NODE_ENV: NodeEnv;

    @Validator.IsString()
    @Validator.IsNotEmpty()
    declare public APP_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    @Type(() => Number)
    declare public APP_PORT: number;

    @Validator.IsUrl({ protocols: ["postgres", "postgresql"], require_protocol: true, require_tld: false })
    declare public DATABASE_URL: string;

    @Validator.IsPositiveInt()
    @Validator.Max(10485760)
    @Type(() => Number)
    declare public BODY_LIMIT_BYTES: number;

    @Validator.IsMsString()
    declare public HSTS_MAX_AGE: ms.StringValue;

    @Validator.IsOrigins()
    declare public ALLOWED_SERVICE_ORIGINS: string;

    @Validator.IsOrigins()
    declare public ALLOWED_UI_ORIGINS: string;
}
