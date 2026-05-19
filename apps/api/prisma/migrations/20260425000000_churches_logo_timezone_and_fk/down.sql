-- Rollback: 20260425000000_churches_logo_timezone_and_fk

ALTER TABLE "church_roles"
    DROP CONSTRAINT IF EXISTS "church_roles_church_id_fkey";

ALTER TABLE "churches"
    DROP COLUMN IF EXISTS "logo_url",
    DROP COLUMN IF EXISTS "timezone";
