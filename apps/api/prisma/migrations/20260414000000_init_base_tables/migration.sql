-- Migration: 20260414000000_init_base_tables
-- Description: Schema base do edahApp — todas as tabelas principais com isolamento multi-tenant por church_id.
-- Apply:    prisma migrate deploy
-- Rollback: pnpm prisma:migrate:rollback 20260414000000_init_base_tables

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE "ChurchRole" AS ENUM ('pastor', 'pastor_auxiliar', 'admin', 'member');
CREATE TYPE "ScheduleMemberStatus" AS ENUM ('confirmed', 'pending', 'substitution_requested');
CREATE TYPE "SubstitutionStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "EventType" AS ENUM ('culto', 'ensaio', 'conferencia', 'celula', 'outro');
CREATE TYPE "RecurrenceType" AS ENUM ('none', 'weekly', 'biweekly', 'monthly');
CREATE TYPE "NotificationChannel" AS ENUM ('whatsapp', 'sms', 'email', 'push');
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'justified');
CREATE TYPE "ConflictDecision" AS ENUM ('pending', 'member_decided', 'leader_decided');

-- ---------------------------------------------------------------------------
-- churches (raiz multi-tenant)
-- ---------------------------------------------------------------------------

CREATE TABLE "churches" (
    "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
    "name"       TEXT         NOT NULL,
    "slug"       TEXT         NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "churches_slug_key" ON "churches"("slug");

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE TABLE "users" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"   UUID         NOT NULL,
    "name"        TEXT         NOT NULL,
    "email"       TEXT,
    "phone"       TEXT,
    "avatar_url"  TEXT,
    "supabase_id" TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key"       ON "users"("email");
CREATE UNIQUE INDEX "users_supabase_id_key" ON "users"("supabase_id");
CREATE INDEX        "users_church_id_idx"   ON "users"("church_id");

ALTER TABLE "users"
    ADD CONSTRAINT "users_church_id_fkey"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- church_roles
-- ---------------------------------------------------------------------------

CREATE TABLE "church_roles" (
    "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"  UUID         NOT NULL,
    "user_id"    UUID         NOT NULL,
    "role"       "ChurchRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "church_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "church_roles_church_id_user_id_role_key" ON "church_roles"("church_id", "user_id", "role");
CREATE INDEX        "church_roles_church_id_idx"              ON "church_roles"("church_id");

ALTER TABLE "church_roles"
    ADD CONSTRAINT "church_roles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------------

CREATE TABLE "departments" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"   UUID         NOT NULL,
    "name"        TEXT         NOT NULL,
    "leader_id"   UUID,
    "description" TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "departments_church_id_idx" ON "departments"("church_id");

ALTER TABLE "departments"
    ADD CONSTRAINT "departments_church_id_fkey"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "departments"
    ADD CONSTRAINT "departments_leader_id_fkey"
    FOREIGN KEY ("leader_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- department_members
-- ---------------------------------------------------------------------------

CREATE TABLE "department_members" (
    "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"     UUID         NOT NULL,
    "department_id" UUID         NOT NULL,
    "user_id"       UUID         NOT NULL,
    "joined_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "department_members_department_id_user_id_key" ON "department_members"("department_id", "user_id");
CREATE INDEX        "department_members_church_id_idx"             ON "department_members"("church_id");

ALTER TABLE "department_members"
    ADD CONSTRAINT "department_members_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "department_members"
    ADD CONSTRAINT "department_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

CREATE TABLE "events" (
    "id"               UUID              NOT NULL DEFAULT gen_random_uuid(),
    "church_id"        UUID              NOT NULL,
    "title"            TEXT              NOT NULL,
    "description"      TEXT,
    "event_type"       "EventType"       NOT NULL,
    "starts_at"        TIMESTAMP(3)      NOT NULL,
    "ends_at"          TIMESTAMP(3),
    "recurrence_type"  "RecurrenceType"  NOT NULL DEFAULT 'none',
    "recurrence_until" TIMESTAMP(3),
    "imported_from"    TEXT,
    "created_at"       TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "events_church_id_idx"  ON "events"("church_id");
CREATE INDEX "events_starts_at_idx"  ON "events"("church_id", "starts_at");

ALTER TABLE "events"
    ADD CONSTRAINT "events_church_id_fkey"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- event_departments
-- ---------------------------------------------------------------------------

CREATE TABLE "event_departments" (
    "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "church_id"     UUID NOT NULL,
    "event_id"      UUID NOT NULL,
    "department_id" UUID NOT NULL,

    CONSTRAINT "event_departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_departments_event_id_department_id_key" ON "event_departments"("event_id", "department_id");
CREATE INDEX        "event_departments_church_id_idx"              ON "event_departments"("church_id");

ALTER TABLE "event_departments"
    ADD CONSTRAINT "event_departments_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_departments"
    ADD CONSTRAINT "event_departments_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- event_notifications
-- ---------------------------------------------------------------------------

CREATE TABLE "event_notifications" (
    "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "church_id"     UUID NOT NULL,
    "event_id"      UUID NOT NULL,
    "department_id" UUID NOT NULL,

    CONSTRAINT "event_notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_notifications_event_id_department_id_key" ON "event_notifications"("event_id", "department_id");
CREATE INDEX        "event_notifications_church_id_idx"              ON "event_notifications"("church_id");

ALTER TABLE "event_notifications"
    ADD CONSTRAINT "event_notifications_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_notifications"
    ADD CONSTRAINT "event_notifications_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- schedules
-- ---------------------------------------------------------------------------

CREATE TABLE "schedules" (
    "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"     UUID         NOT NULL,
    "event_id"      UUID         NOT NULL,
    "department_id" UUID         NOT NULL,
    "minister_id"   UUID,
    "schedule_info" TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "schedules_event_id_department_id_key" ON "schedules"("event_id", "department_id");
CREATE INDEX        "schedules_church_id_idx"              ON "schedules"("church_id");

ALTER TABLE "schedules"
    ADD CONSTRAINT "schedules_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedules"
    ADD CONSTRAINT "schedules_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedules"
    ADD CONSTRAINT "schedules_minister_id_fkey"
    FOREIGN KEY ("minister_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- schedule_members
-- ---------------------------------------------------------------------------

CREATE TABLE "schedule_members" (
    "id"          UUID                   NOT NULL DEFAULT gen_random_uuid(),
    "church_id"   UUID                   NOT NULL,
    "schedule_id" UUID                   NOT NULL,
    "user_id"     UUID                   NOT NULL,
    "status"      "ScheduleMemberStatus" NOT NULL DEFAULT 'pending',
    "created_at"  TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3)           NOT NULL,

    CONSTRAINT "schedule_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "schedule_members_schedule_id_user_id_key" ON "schedule_members"("schedule_id", "user_id");
CREATE INDEX        "schedule_members_church_id_idx"           ON "schedule_members"("church_id");

ALTER TABLE "schedule_members"
    ADD CONSTRAINT "schedule_members_schedule_id_fkey"
    FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "schedule_members"
    ADD CONSTRAINT "schedule_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- schedule_substitutions
-- ---------------------------------------------------------------------------

CREATE TABLE "schedule_substitutions" (
    "id"                 UUID                 NOT NULL DEFAULT gen_random_uuid(),
    "church_id"          UUID                 NOT NULL,
    "schedule_member_id" UUID                 NOT NULL,
    "from_user_id"       UUID                 NOT NULL,
    "to_user_id"         UUID                 NOT NULL,
    "reason"             TEXT,
    "status"             "SubstitutionStatus" NOT NULL DEFAULT 'pending',
    "approved_by"        UUID,
    "approved_at"        TIMESTAMP(3),
    "created_at"         TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMP(3)         NOT NULL,

    CONSTRAINT "schedule_substitutions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "schedule_substitutions_church_id_idx" ON "schedule_substitutions"("church_id");

ALTER TABLE "schedule_substitutions"
    ADD CONSTRAINT "schedule_substitutions_schedule_member_id_fkey"
    FOREIGN KEY ("schedule_member_id") REFERENCES "schedule_members"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "schedule_substitutions"
    ADD CONSTRAINT "schedule_substitutions_from_user_id_fkey"
    FOREIGN KEY ("from_user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedule_substitutions"
    ADD CONSTRAINT "schedule_substitutions_to_user_id_fkey"
    FOREIGN KEY ("to_user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedule_substitutions"
    ADD CONSTRAINT "schedule_substitutions_approved_by_fkey"
    FOREIGN KEY ("approved_by") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- availability
-- ---------------------------------------------------------------------------

CREATE TABLE "availability" (
    "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"     UUID         NOT NULL,
    "user_id"       UUID         NOT NULL,
    "department_id" UUID         NOT NULL,
    "date"          DATE         NOT NULL,
    "available"     BOOLEAN      NOT NULL DEFAULT true,
    "note"          TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "availability_user_id_department_id_date_key" ON "availability"("user_id", "department_id", "date");
CREATE INDEX        "availability_church_id_idx"                  ON "availability"("church_id");

ALTER TABLE "availability"
    ADD CONSTRAINT "availability_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability"
    ADD CONSTRAINT "availability_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- conflict_requests
-- ---------------------------------------------------------------------------

CREATE TABLE "conflict_requests" (
    "id"                  UUID              NOT NULL DEFAULT gen_random_uuid(),
    "church_id"           UUID              NOT NULL,
    "member_id"           UUID              NOT NULL,
    "schedule_id_a"       UUID              NOT NULL,
    "schedule_id_b"       UUID              NOT NULL,
    "decision"            "ConflictDecision" NOT NULL DEFAULT 'pending',
    "decided_by"          UUID,
    "decided_at"          TIMESTAMP(3),
    "resolved_schedule_id" UUID,
    "created_at"          TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "conflict_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "conflict_requests_church_id_idx"  ON "conflict_requests"("church_id");
CREATE INDEX "conflict_requests_member_id_idx"  ON "conflict_requests"("member_id");

ALTER TABLE "conflict_requests"
    ADD CONSTRAINT "conflict_requests_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "conflict_requests"
    ADD CONSTRAINT "conflict_requests_decided_by_fkey"
    FOREIGN KEY ("decided_by") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- songs
-- ---------------------------------------------------------------------------

CREATE TABLE "songs" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"   UUID         NOT NULL,
    "schedule_id" UUID         NOT NULL,
    "title"       TEXT         NOT NULL,
    "artist"      TEXT,
    "youtube_url" TEXT,
    "key"         TEXT,
    "order"       INTEGER      NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "songs_church_id_idx"   ON "songs"("church_id");
CREATE INDEX "songs_schedule_id_idx" ON "songs"("schedule_id");

ALTER TABLE "songs"
    ADD CONSTRAINT "songs_schedule_id_fkey"
    FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- rehearsals
-- ---------------------------------------------------------------------------

CREATE TABLE "rehearsals" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"   UUID         NOT NULL,
    "schedule_id" UUID         NOT NULL,
    "starts_at"   TIMESTAMP(3) NOT NULL,
    "location"    TEXT,
    "notes"       TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rehearsals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rehearsals_church_id_idx"   ON "rehearsals"("church_id");
CREATE INDEX "rehearsals_schedule_id_idx" ON "rehearsals"("schedule_id");

ALTER TABLE "rehearsals"
    ADD CONSTRAINT "rehearsals_schedule_id_fkey"
    FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- rehearsal_reminders
-- ---------------------------------------------------------------------------

CREATE TABLE "rehearsal_reminders" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"    UUID         NOT NULL,
    "rehearsal_id" UUID         NOT NULL,
    "hours_before" INTEGER      NOT NULL,
    "sent"         BOOLEAN      NOT NULL DEFAULT false,
    "sent_at"      TIMESTAMP(3),
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rehearsal_reminders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rehearsal_reminders_church_id_idx"    ON "rehearsal_reminders"("church_id");
CREATE INDEX "rehearsal_reminders_rehearsal_id_idx" ON "rehearsal_reminders"("rehearsal_id");

ALTER TABLE "rehearsal_reminders"
    ADD CONSTRAINT "rehearsal_reminders_rehearsal_id_fkey"
    FOREIGN KEY ("rehearsal_id") REFERENCES "rehearsals"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------

CREATE TABLE "attendance" (
    "id"          UUID              NOT NULL DEFAULT gen_random_uuid(),
    "church_id"   UUID              NOT NULL,
    "event_id"    UUID              NOT NULL,
    "user_id"     UUID              NOT NULL,
    "status"      "AttendanceStatus" NOT NULL DEFAULT 'present',
    "note"        TEXT,
    "recorded_at" TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendance_event_id_user_id_key" ON "attendance"("event_id", "user_id");
CREATE INDEX        "attendance_church_id_idx"        ON "attendance"("church_id");

ALTER TABLE "attendance"
    ADD CONSTRAINT "attendance_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance"
    ADD CONSTRAINT "attendance_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- service_timeline
-- ---------------------------------------------------------------------------

CREATE TABLE "service_timeline" (
    "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
    "church_id"        UUID         NOT NULL,
    "event_id"         UUID         NOT NULL,
    "order"            INTEGER      NOT NULL,
    "moment_type"      TEXT         NOT NULL,
    "description"      TEXT,
    "responsible_id"   UUID,
    "estimated_minutes" INTEGER,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_timeline_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_timeline_church_id_idx" ON "service_timeline"("church_id");
CREATE INDEX "service_timeline_event_id_idx"  ON "service_timeline"("event_id");

ALTER TABLE "service_timeline"
    ADD CONSTRAINT "service_timeline_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "service_timeline"
    ADD CONSTRAINT "service_timeline_responsible_id_fkey"
    FOREIGN KEY ("responsible_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

CREATE TABLE "notifications" (
    "id"           UUID                  NOT NULL DEFAULT gen_random_uuid(),
    "church_id"    UUID                  NOT NULL,
    "recipient_id" UUID                  NOT NULL,
    "channel"      "NotificationChannel" NOT NULL,
    "title"        TEXT                  NOT NULL,
    "body"         TEXT                  NOT NULL,
    "sent_at"      TIMESTAMP(3),
    "read_at"      TIMESTAMP(3),
    "created_at"   TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_church_id_idx"    ON "notifications"("church_id");
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_church_id_fkey"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey"
    FOREIGN KEY ("recipient_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
