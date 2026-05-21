CREATE TABLE "invite_tokens" (
    "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "church_id"     UUID        NOT NULL,
    "department_id" UUID,
    "invited_by"    UUID        NOT NULL,
    "email"         TEXT        NOT NULL,
    "role"          "ChurchRole" NOT NULL,
    "token"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "expires_at"    TIMESTAMP(3) NOT NULL,
    "used_at"       TIMESTAMP(3),
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invite_tokens_token_key" ON "invite_tokens"("token");
CREATE INDEX "invite_tokens_email_church_id_idx" ON "invite_tokens"("email", "church_id");

ALTER TABLE "invite_tokens"
    ADD CONSTRAINT "invite_tokens_church_id_fkey"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invite_tokens"
    ADD CONSTRAINT "invite_tokens_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invite_tokens"
    ADD CONSTRAINT "invite_tokens_invited_by_fkey"
    FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
