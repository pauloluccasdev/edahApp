-- Migration: 20260426000000_add_audit_logs
-- Description: Cria tabela audit_logs para registrar ações do perfil Suporte em qualquer igreja.
-- Apply:    prisma migrate deploy
-- Rollback: pnpm prisma:migrate:rollback 20260426000000_add_audit_logs

CREATE TABLE "audit_logs" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "operator_id" UUID         NOT NULL,
    "church_id"   UUID,
    "action"      TEXT         NOT NULL,
    "payload"     JSONB        NOT NULL DEFAULT '{}',
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_operator_id_idx" ON "audit_logs"("operator_id");
CREATE INDEX "audit_logs_church_id_idx"   ON "audit_logs"("church_id");
CREATE INDEX "audit_logs_action_idx"      ON "audit_logs"("action");
CREATE INDEX "audit_logs_created_at_idx"  ON "audit_logs"("created_at");

ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_operator_id_fkey"
    FOREIGN KEY ("operator_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_church_id_fkey"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
