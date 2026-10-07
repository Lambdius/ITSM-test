CREATE TABLE "profile" (
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3),
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "links" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "profile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profile_links_array" CHECK (jsonb_typeof("links") = 'array')
);

CREATE TABLE "profile_skill" (
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3),
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    CONSTRAINT "profile_skill_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profile_skill_profile_id_fkey" FOREIGN KEY ("profile_id")
        REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "profile_skill_profile_id_name_key" ON "profile_skill"("profile_id", "name");

CREATE TABLE "experience" (
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3),
    "id" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "achievements" TEXT NOT NULL DEFAULT '',
    "profile_id" UUID NOT NULL,
    CONSTRAINT "experience_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "experience_valid_period" CHECK ("end_date" IS NULL OR "end_date" >= "start_date"),
    CONSTRAINT "experience_profile_id_fkey" FOREIGN KEY ("profile_id")
        REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "experience_profile_id_idx" ON "experience"("profile_id");

CREATE TABLE "project" (
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3),
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    CONSTRAINT "project_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "project_profile_id_fkey" FOREIGN KEY ("profile_id")
        REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "project_profile_id_idx" ON "project"("profile_id");
