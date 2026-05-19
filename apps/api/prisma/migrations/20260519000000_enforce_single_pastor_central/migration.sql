-- Migration: 20260519000000_enforce_single_pastor_central
-- Description: Garante que cada igreja tenha no máximo um pastor central via índice único parcial.
--              O índice cobre apenas as linhas com role = 'pastor_central', permitindo múltiplos
--              pastor_auxiliar, lider e membro por igreja sem restrição.
-- Apply:    prisma migrate deploy
-- Rollback: DROP INDEX IF EXISTS "church_roles_one_pastor_central_idx";

CREATE UNIQUE INDEX "church_roles_one_pastor_central_idx"
    ON "church_roles" ("church_id")
    WHERE role = 'pastor_central';
