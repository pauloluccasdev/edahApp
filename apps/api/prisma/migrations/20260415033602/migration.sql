-- DropForeignKey
ALTER TABLE "availability" DROP CONSTRAINT "availability_department_id_fkey";

-- DropForeignKey
ALTER TABLE "availability" DROP CONSTRAINT "availability_user_id_fkey";

-- DropForeignKey
ALTER TABLE "department_members" DROP CONSTRAINT "department_members_department_id_fkey";

-- DropForeignKey
ALTER TABLE "department_members" DROP CONSTRAINT "department_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "event_departments" DROP CONSTRAINT "event_departments_department_id_fkey";

-- DropForeignKey
ALTER TABLE "event_departments" DROP CONSTRAINT "event_departments_event_id_fkey";

-- DropForeignKey
ALTER TABLE "event_notifications" DROP CONSTRAINT "event_notifications_department_id_fkey";

-- DropForeignKey
ALTER TABLE "event_notifications" DROP CONSTRAINT "event_notifications_event_id_fkey";

-- DropForeignKey
ALTER TABLE "rehearsal_reminders" DROP CONSTRAINT "rehearsal_reminders_rehearsal_id_fkey";

-- DropForeignKey
ALTER TABLE "rehearsals" DROP CONSTRAINT "rehearsals_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_members" DROP CONSTRAINT "schedule_members_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_substitutions" DROP CONSTRAINT "schedule_substitutions_schedule_member_id_fkey";

-- DropForeignKey
ALTER TABLE "service_timeline" DROP CONSTRAINT "service_timeline_event_id_fkey";

-- DropForeignKey
ALTER TABLE "songs" DROP CONSTRAINT "songs_schedule_id_fkey";

-- DropIndex
DROP INDEX "attendance_church_id_idx";

-- DropIndex
DROP INDEX "availability_church_id_idx";

-- DropIndex
DROP INDEX "church_roles_church_id_idx";

-- DropIndex
DROP INDEX "conflict_requests_church_id_idx";

-- DropIndex
DROP INDEX "conflict_requests_member_id_idx";

-- DropIndex
DROP INDEX "department_members_church_id_idx";

-- DropIndex
DROP INDEX "departments_church_id_idx";

-- DropIndex
DROP INDEX "event_departments_church_id_idx";

-- DropIndex
DROP INDEX "event_notifications_church_id_idx";

-- DropIndex
DROP INDEX "events_church_id_idx";

-- DropIndex
DROP INDEX "events_starts_at_idx";

-- DropIndex
DROP INDEX "notifications_church_id_idx";

-- DropIndex
DROP INDEX "notifications_recipient_id_idx";

-- DropIndex
DROP INDEX "rehearsal_reminders_church_id_idx";

-- DropIndex
DROP INDEX "rehearsal_reminders_rehearsal_id_idx";

-- DropIndex
DROP INDEX "rehearsals_church_id_idx";

-- DropIndex
DROP INDEX "rehearsals_schedule_id_idx";

-- DropIndex
DROP INDEX "schedule_members_church_id_idx";

-- DropIndex
DROP INDEX "schedule_substitutions_church_id_idx";

-- DropIndex
DROP INDEX "schedules_church_id_idx";

-- DropIndex
DROP INDEX "service_timeline_church_id_idx";

-- DropIndex
DROP INDEX "service_timeline_event_id_idx";

-- DropIndex
DROP INDEX "songs_church_id_idx";

-- DropIndex
DROP INDEX "songs_schedule_id_idx";

-- DropIndex
DROP INDEX "users_church_id_idx";

-- AddForeignKey
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_departments" ADD CONSTRAINT "event_departments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_departments" ADD CONSTRAINT "event_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_notifications" ADD CONSTRAINT "event_notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_notifications" ADD CONSTRAINT "event_notifications_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_members" ADD CONSTRAINT "schedule_members_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_substitutions" ADD CONSTRAINT "schedule_substitutions_schedule_member_id_fkey" FOREIGN KEY ("schedule_member_id") REFERENCES "schedule_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rehearsals" ADD CONSTRAINT "rehearsals_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rehearsal_reminders" ADD CONSTRAINT "rehearsal_reminders_rehearsal_id_fkey" FOREIGN KEY ("rehearsal_id") REFERENCES "rehearsals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_timeline" ADD CONSTRAINT "service_timeline_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
