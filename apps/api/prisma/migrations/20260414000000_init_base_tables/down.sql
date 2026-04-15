-- Rollback: 20260414000000_init_base_tables
-- Desfaz completamente a migration init_base_tables.
-- As tabelas são dropadas em ordem inversa às dependências de FK.
-- CASCADE garante que índices e constraints sejam removidos junto.

DROP TABLE IF EXISTS "notifications"          CASCADE;
DROP TABLE IF EXISTS "service_timeline"       CASCADE;
DROP TABLE IF EXISTS "attendance"             CASCADE;
DROP TABLE IF EXISTS "rehearsal_reminders"    CASCADE;
DROP TABLE IF EXISTS "rehearsals"             CASCADE;
DROP TABLE IF EXISTS "songs"                  CASCADE;
DROP TABLE IF EXISTS "conflict_requests"      CASCADE;
DROP TABLE IF EXISTS "availability"           CASCADE;
DROP TABLE IF EXISTS "schedule_substitutions" CASCADE;
DROP TABLE IF EXISTS "schedule_members"       CASCADE;
DROP TABLE IF EXISTS "schedules"              CASCADE;
DROP TABLE IF EXISTS "event_notifications"    CASCADE;
DROP TABLE IF EXISTS "event_departments"      CASCADE;
DROP TABLE IF EXISTS "events"                 CASCADE;
DROP TABLE IF EXISTS "department_members"     CASCADE;
DROP TABLE IF EXISTS "departments"            CASCADE;
DROP TABLE IF EXISTS "church_roles"           CASCADE;
DROP TABLE IF EXISTS "users"                  CASCADE;
DROP TABLE IF EXISTS "churches"               CASCADE;

DROP TYPE IF EXISTS "ConflictDecision";
DROP TYPE IF EXISTS "AttendanceStatus";
DROP TYPE IF EXISTS "NotificationChannel";
DROP TYPE IF EXISTS "RecurrenceType";
DROP TYPE IF EXISTS "EventType";
DROP TYPE IF EXISTS "SubstitutionStatus";
DROP TYPE IF EXISTS "ScheduleMemberStatus";
DROP TYPE IF EXISTS "ChurchRole";
