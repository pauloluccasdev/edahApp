-- Rollback: 20260415000000_update_roles_and_users

DROP INDEX IF EXISTS "users_is_suporte_idx";

ALTER TABLE "users"
    DROP COLUMN IF EXISTS "whatsapp",
    DROP COLUMN IF EXISTS "is_suporte";

ALTER TYPE "ChurchRole" RENAME TO "ChurchRole_old";

CREATE TYPE "ChurchRole" AS ENUM ('pastor', 'pastor_auxiliar', 'admin', 'member');

ALTER TABLE "church_roles"
    ALTER COLUMN "role" TYPE "ChurchRole"
    USING (
        CASE "role"::text
            WHEN 'pastor_central' THEN 'pastor'
            WHEN 'lider'          THEN 'admin'
            WHEN 'membro'         THEN 'member'
            ELSE "role"::text
        END
    )::"ChurchRole";

DROP TYPE "ChurchRole_old";
