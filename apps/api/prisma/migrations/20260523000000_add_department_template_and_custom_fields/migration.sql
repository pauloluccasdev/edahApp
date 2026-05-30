-- CreateEnum
CREATE TYPE "DepartmentTemplate" AS ENUM ('louvor', 'gc', 'midia', 'discipulado', 'adolescentes', 'danca', 'cronograma_culto', 'personalizado');

-- AlterTable departments: adiciona template e is_active
ALTER TABLE "departments"
  ADD COLUMN "template"   "DepartmentTemplate" NOT NULL DEFAULT 'personalizado',
  ADD COLUMN "is_active"  BOOLEAN              NOT NULL DEFAULT true;

-- CreateTable department_fields
CREATE TABLE "department_fields" (
  "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
  "department_id" UUID         NOT NULL,
  "church_id"     UUID         NOT NULL,
  "label"         TEXT         NOT NULL,
  "order"         INTEGER      NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "department_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable schedule_field_values
CREATE TABLE "schedule_field_values" (
  "id"                  UUID         NOT NULL DEFAULT gen_random_uuid(),
  "schedule_id"         UUID         NOT NULL,
  "department_field_id" UUID         NOT NULL,
  "value"               TEXT         NOT NULL,
  "filled_by"           UUID         NOT NULL,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "schedule_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "department_fields_department_id_idx" ON "department_fields"("department_id");

-- CreateIndex: garante 1 valor por campo por escala
CREATE UNIQUE INDEX "schedule_field_values_schedule_id_department_field_id_key"
  ON "schedule_field_values"("schedule_id", "department_field_id");

-- AddForeignKey department_fields → departments (cascade on delete)
ALTER TABLE "department_fields"
  ADD CONSTRAINT "department_fields_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey schedule_field_values → schedules (cascade on delete)
ALTER TABLE "schedule_field_values"
  ADD CONSTRAINT "schedule_field_values_schedule_id_fkey"
  FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey schedule_field_values → department_fields (cascade on delete)
ALTER TABLE "schedule_field_values"
  ADD CONSTRAINT "schedule_field_values_department_field_id_fkey"
  FOREIGN KEY ("department_field_id") REFERENCES "department_fields"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey schedule_field_values → users (restrict: não apaga user com valores preenchidos)
ALTER TABLE "schedule_field_values"
  ADD CONSTRAINT "schedule_field_values_filled_by_fkey"
  FOREIGN KEY ("filled_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
