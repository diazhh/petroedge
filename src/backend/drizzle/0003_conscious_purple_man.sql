DO $$ BEGIN
 CREATE TYPE "bha_status" AS ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'FAILED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "casing_status" AS ENUM('PLANNED', 'SET', 'CEMENTED', 'TESTED', 'FAILED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "casing_string" AS ENUM('CONDUCTOR', 'SURFACE', 'INTERMEDIATE', 'PRODUCTION', 'LINER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "ddr_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "mud_type" AS ENUM('WBM', 'OBM', 'SBM', 'FOAM', 'AIR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "plan_status" AS ENUM('DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "rig_state" AS ENUM('DRILLING', 'CIRCULATING', 'TRIPPING_IN', 'TRIPPING_OUT', 'CONNECTION', 'REAMING', 'BACKREAMING', 'CASING', 'CEMENTING', 'LOGGING', 'TESTING', 'WAITING', 'RIG_REPAIR', 'NPT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "trajectory_type" AS ENUM('PLANNED', 'ACTUAL', 'PROPOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "well_purpose" AS ENUM('EXPLORATION', 'DEVELOPMENT', 'INFILL', 'WORKOVER', 'APPRAISAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "well_type_drilling" AS ENUM('VERTICAL', 'DIRECTIONAL', 'HORIZONTAL', 'ERD', 'MULTILATERAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "well_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"rig_id" uuid,
	"plan_name" varchar(100) NOT NULL,
	"plan_version" integer DEFAULT 1,
	"plan_status" "plan_status" DEFAULT 'DRAFT',
	"well_type" "well_type_drilling",
	"well_purpose" "well_purpose",
	"planned_td_md_ft" numeric(10, 2),
	"planned_td_tvd_ft" numeric(10, 2),
	"spud_date_planned" timestamp,
	"td_date_planned" timestamp,
	"days_planned" integer,
	"afe_number" varchar(50),
	"estimated_cost_usd" numeric(15, 2),
	"prepared_by" uuid,
	"reviewed_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_plans" ADD CONSTRAINT "well_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_plans" ADD CONSTRAINT "well_plans_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "wells"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_plans" ADD CONSTRAINT "well_plans_prepared_by_users_id_fk" FOREIGN KEY ("prepared_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_plans" ADD CONSTRAINT "well_plans_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_plans" ADD CONSTRAINT "well_plans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
