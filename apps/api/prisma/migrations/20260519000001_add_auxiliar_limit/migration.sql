-- Migration: 20260519000001_add_auxiliar_limit
-- Description: Adiciona limite configurável de pastores auxiliares por igreja.
--              O limite padrão é 1. Suporte pode aumentar via PATCH.
-- Apply:    prisma migrate deploy
-- Rollback: ALTER TABLE "churches" DROP COLUMN "auxiliar_limit";

ALTER TABLE "churches"
    ADD COLUMN "auxiliar_limit" INTEGER NOT NULL DEFAULT 1;
