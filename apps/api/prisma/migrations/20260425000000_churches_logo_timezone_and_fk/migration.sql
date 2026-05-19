-- Migration: 20260425000000_churches_logo_timezone_and_fk
-- Description: Adiciona logo_url e timezone em churches; adiciona FK church_roles.church_id → churches.id.
-- Apply:    prisma migrate deploy
-- Rollback: pnpm prisma:migrate:rollback 20260425000000_churches_logo_timezone_and_fk

-- ---------------------------------------------------------------------------
-- Adiciona colunas logo_url e timezone em churches
-- ---------------------------------------------------------------------------

ALTER TABLE "churches"
    ADD COLUMN "logo_url"  TEXT,
    ADD COLUMN "timezone"  TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- ---------------------------------------------------------------------------
-- Adiciona FK church_roles.church_id → churches.id (estava faltando)
-- ---------------------------------------------------------------------------

ALTER TABLE "church_roles"
    ADD CONSTRAINT "church_roles_church_id_fkey"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
