-- Migration: 20260415000000_update_roles_and_users
-- Description: Atualiza hierarquia de papéis e adiciona campos whatsapp e is_suporte em users.
-- Rollback: pnpm prisma:migrate:rollback 20260415000000_update_roles_and_users

-- ---------------------------------------------------------------------------
-- Atualiza enum ChurchRole
-- Renomeia os valores antigos (pastor→pastor_central, admin→lider, member→membro)
-- Estratégia: recria o tipo sem dados incompatíveis (ambiente de dev)
-- ---------------------------------------------------------------------------

ALTER TYPE "ChurchRole" RENAME TO "ChurchRole_old";

CREATE TYPE "ChurchRole" AS ENUM ('pastor_central', 'pastor_auxiliar', 'lider', 'membro');

ALTER TABLE "church_roles"
    ALTER COLUMN "role" TYPE "ChurchRole"
    USING (
        CASE "role"::text
            WHEN 'pastor'  THEN 'pastor_central'
            WHEN 'admin'   THEN 'lider'
            WHEN 'member'  THEN 'membro'
            ELSE "role"::text
        END
    )::"ChurchRole";

DROP TYPE "ChurchRole_old";

-- ---------------------------------------------------------------------------
-- Adiciona campos em users
-- ---------------------------------------------------------------------------

ALTER TABLE "users"
    ADD COLUMN "whatsapp"   TEXT,
    ADD COLUMN "is_suporte" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "users_is_suporte_idx" ON "users"("is_suporte") WHERE "is_suporte" = true;
