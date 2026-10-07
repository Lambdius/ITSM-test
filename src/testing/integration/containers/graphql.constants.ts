import { NodeEnv } from "~common/enums";

export const APPLICATION_ENV = {
    NODE_ENV: NodeEnv.DEVELOPMENT,
    APP_HOST: "127.0.0.1",
    APP_PORT: "3000",
    BODY_LIMIT_BYTES: "1048576",
    HSTS_MAX_AGE: "365d",
    ALLOWED_SERVICE_ORIGINS: "[]",
    ALLOWED_UI_ORIGINS: '["http://localhost:3000","http://127.0.0.1:3000","https://sandbox.embed.apollographql.com"]',
};
