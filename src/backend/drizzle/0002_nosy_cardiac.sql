DO $$ BEGIN
 CREATE TYPE "ipr_model" AS ENUM('VOGEL', 'FETKOVITCH', 'STANDING', 'COMPOSITE', 'JONES_BLOUNT_GLAZE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "test_status" AS ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ANALYZED', 'APPROVED', 'CANCELLED', 'SUSPENDED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "test_type_code" AS ENUM('PRODUCTION', 'BUILDUP', 'DRAWDOWN', 'ISOCHRONAL', 'INTERFERENCE', 'PVT_SAMPLE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "vlp_correlation" AS ENUM('BEGGS_BRILL', 'HAGEDORN_BROWN', 'DUNS_ROS', 'ORKISZEWSKI', 'GRAY', 'ANSARI');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ipr_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_test_id" uuid NOT NULL,
	"model" "ipr_model" NOT NULL,
	"reservoir_pressure_psi" numeric(10, 2) NOT NULL,
	"bubble_point_psi" numeric(10, 2),
	"test_rate_bopd" numeric(12, 2) NOT NULL,
	"test_pwf_psi" numeric(10, 2) NOT NULL,
	"qmax_bopd" numeric(12, 2),
	"productivity_index" numeric(10, 4),
	"c_coefficient" numeric(15, 6),
	"n_exponent" numeric(6, 4),
	"aof_mscfd" numeric(12, 2),
	"ipr_curve" jsonb,
	"r_squared" numeric(6, 4),
	"analyst" varchar(100),
	"analysis_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nodal_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_id" uuid NOT NULL,
	"ipr_analysis_id" uuid,
	"vlp_analysis_id" uuid,
	"operating_rate_bopd" numeric(12, 2),
	"operating_pwf_psi" numeric(10, 2),
	"max_rate_bopd" numeric(12, 2),
	"sensitivity_results" jsonb,
	"recommendations" text,
	"analyst" varchar(100),
	"analysis_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_test_id" uuid NOT NULL,
	"reading_time" timestamp NOT NULL,
	"elapsed_hours" numeric(10, 4),
	"tubing_pressure_psi" numeric(10, 2),
	"casing_pressure_psi" numeric(10, 2),
	"bottomhole_pressure_psi" numeric(10, 2),
	"oil_rate_bopd" numeric(12, 2),
	"water_rate_bwpd" numeric(12, 2),
	"gas_rate_mscfd" numeric(12, 2),
	"wellhead_temp_f" numeric(8, 2),
	"bottomhole_temp_f" numeric(8, 2),
	"choke_size_64ths" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" "test_type_code" NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"requires_separator" boolean DEFAULT false,
	"requires_pressure_gauge" boolean DEFAULT false,
	"requires_samples" boolean DEFAULT false,
	"required_fields" jsonb DEFAULT '[]',
	"optional_fields" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vlp_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_test_id" uuid,
	"well_id" uuid NOT NULL,
	"correlation" "vlp_correlation" NOT NULL,
	"tubing_id_inches" numeric(6, 3) NOT NULL,
	"tubing_depth_ft" numeric(10, 2) NOT NULL,
	"wellhead_pressure_psi" numeric(10, 2) NOT NULL,
	"deviation_degrees" numeric(6, 2) DEFAULT '0',
	"roughness_inches" numeric(6, 4) DEFAULT '0.0006',
	"wellhead_temp_f" numeric(8, 2),
	"bottomhole_temp_f" numeric(8, 2),
	"water_cut_percent" numeric(5, 2),
	"gor_scf_stb" numeric(10, 2),
	"oil_api" numeric(6, 2),
	"gas_sg" numeric(6, 4),
	"water_sg" numeric(6, 4) DEFAULT '1.02',
	"vlp_curve" jsonb,
	"analyst" varchar(100),
	"analysis_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "well_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"test_type_id" uuid NOT NULL,
	"test_number" varchar(20) NOT NULL,
	"test_date" timestamp NOT NULL,
	"status" "test_status" DEFAULT 'PLANNED' NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"duration_hours" numeric(8, 2),
	"choke_size_64ths" integer,
	"separator_pressure_psi" numeric(10, 2),
	"separator_temperature_f" numeric(8, 2),
	"oil_rate_bopd" numeric(12, 2),
	"water_rate_bwpd" numeric(12, 2),
	"gas_rate_mscfd" numeric(12, 2),
	"liquid_rate_blpd" numeric(12, 2),
	"tubing_pressure_psi" numeric(10, 2),
	"casing_pressure_psi" numeric(10, 2),
	"flowing_bhp_psi" numeric(10, 2),
	"static_bhp_psi" numeric(10, 2),
	"wellhead_temp_f" numeric(8, 2),
	"bottomhole_temp_f" numeric(8, 2),
	"bsw_percent" numeric(5, 2),
	"water_cut_percent" numeric(5, 2),
	"oil_api_gravity" numeric(6, 2),
	"gas_specific_gravity" numeric(6, 4),
	"gor_scf_stb" numeric(10, 2),
	"productivity_index" numeric(10, 4),
	"specific_productivity_index" numeric(10, 4),
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ipr_analyses" ADD CONSTRAINT "ipr_analyses_well_test_id_well_tests_id_fk" FOREIGN KEY ("well_test_id") REFERENCES "well_tests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodal_analyses" ADD CONSTRAINT "nodal_analyses_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "wells"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodal_analyses" ADD CONSTRAINT "nodal_analyses_ipr_analysis_id_ipr_analyses_id_fk" FOREIGN KEY ("ipr_analysis_id") REFERENCES "ipr_analyses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodal_analyses" ADD CONSTRAINT "nodal_analyses_vlp_analysis_id_vlp_analyses_id_fk" FOREIGN KEY ("vlp_analysis_id") REFERENCES "vlp_analyses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_readings" ADD CONSTRAINT "test_readings_well_test_id_well_tests_id_fk" FOREIGN KEY ("well_test_id") REFERENCES "well_tests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_types" ADD CONSTRAINT "test_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vlp_analyses" ADD CONSTRAINT "vlp_analyses_well_test_id_well_tests_id_fk" FOREIGN KEY ("well_test_id") REFERENCES "well_tests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vlp_analyses" ADD CONSTRAINT "vlp_analyses_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "wells"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "wells"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_test_type_id_test_types_id_fk" FOREIGN KEY ("test_type_id") REFERENCES "test_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
