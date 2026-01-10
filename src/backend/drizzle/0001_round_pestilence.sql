DO $$ BEGIN
 CREATE TYPE "basin_type" AS ENUM('FORELAND', 'RIFT', 'PASSIVE_MARGIN', 'INTRACRATONIC', 'FOREARC');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "drive_mechanism" AS ENUM('SOLUTION_GAS', 'GAS_CAP', 'WATER_DRIVE', 'GRAVITY_DRAINAGE', 'COMBINATION');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "field_status" AS ENUM('PRODUCING', 'DEVELOPING', 'ABANDONED', 'EXPLORATION');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "field_type" AS ENUM('ONSHORE', 'OFFSHORE_SHALLOW', 'OFFSHORE_DEEP', 'UNCONVENTIONAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "fluid_type" AS ENUM('BLACK_OIL', 'VOLATILE_OIL', 'RETROGRADE_GAS', 'WET_GAS', 'DRY_GAS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "lift_method" AS ENUM('FLOWING', 'ESP', 'GAS_LIFT', 'SUCKER_ROD', 'PCP', 'PLUNGER_LIFT', 'HYDRAULIC_PUMP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "lithology" AS ENUM('SANDSTONE', 'CARBONATE', 'SHALE', 'CONGLOMERATE', 'FRACTURED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "well_status" AS ENUM('PRODUCING', 'INJECTING', 'SHUT_IN', 'ABANDONED', 'DRILLING', 'SUSPENDED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "well_type" AS ENUM('PRODUCER', 'INJECTOR', 'OBSERVATION', 'DISPOSAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "basins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"country" varchar(50),
	"region" varchar(100),
	"basin_type" "basin_type",
	"area_km2" numeric(12, 2),
	"age" varchar(50),
	"tectonic_setting" text,
	"min_latitude" numeric(10, 7),
	"max_latitude" numeric(10, 7),
	"min_longitude" numeric(10, 7),
	"max_longitude" numeric(10, 7),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"basin_id" uuid,
	"field_name" varchar(100) NOT NULL,
	"field_code" varchar(30),
	"operator" varchar(100),
	"discovery_date" date,
	"first_production_date" date,
	"area_acres" numeric(12, 2),
	"center_latitude" numeric(10, 7),
	"center_longitude" numeric(10, 7),
	"status" "field_status" DEFAULT 'PRODUCING' NOT NULL,
	"field_type" "field_type",
	"total_wells" integer DEFAULT 0,
	"active_wells" integer DEFAULT 0,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reservoirs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"reservoir_name" varchar(100) NOT NULL,
	"reservoir_code" varchar(30),
	"formation_name" varchar(100),
	"formation_age" varchar(50),
	"lithology" "lithology",
	"avg_porosity" numeric(5, 4),
	"avg_permeability_md" numeric(12, 4),
	"avg_water_saturation" numeric(5, 4),
	"net_to_gross" numeric(5, 4),
	"top_depth_tvd_ft" numeric(10, 2),
	"bottom_depth_tvd_ft" numeric(10, 2),
	"avg_net_pay_ft" numeric(10, 2),
	"area_acres" numeric(12, 2),
	"bulk_volume_acre_ft" numeric(14, 2),
	"initial_pressure_psi" numeric(10, 2),
	"current_pressure_psi" numeric(10, 2),
	"reservoir_temperature_f" numeric(8, 2),
	"pressure_gradient_psi_ft" numeric(8, 4),
	"fluid_type" "fluid_type",
	"drive_mechanism" "drive_mechanism",
	"owc_depth_tvd_ft" numeric(10, 2),
	"goc_depth_tvd_ft" numeric(10, 2),
	"ooip_mmstb" numeric(14, 4),
	"ogip_bcf" numeric(14, 4),
	"recovery_factor" numeric(5, 4),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"primary_reservoir_id" uuid,
	"well_name" varchar(100) NOT NULL,
	"well_code" varchar(30),
	"api_number" varchar(50),
	"well_type" "well_type" DEFAULT 'PRODUCER' NOT NULL,
	"status" "well_status" DEFAULT 'PRODUCING' NOT NULL,
	"lift_method" "lift_method",
	"surface_latitude" numeric(10, 7),
	"surface_longitude" numeric(10, 7),
	"surface_elevation_ft" numeric(10, 2),
	"total_depth_md_ft" numeric(10, 2),
	"total_depth_tvd_ft" numeric(10, 2),
	"spud_date" date,
	"completion_date" date,
	"first_production_date" date,
	"abandonment_date" date,
	"tubing_size" numeric(5, 3),
	"casing_size" numeric(5, 3),
	"current_oil_rate_bopd" numeric(10, 2),
	"current_gas_rate_mscfd" numeric(10, 2),
	"current_water_rate_bwpd" numeric(10, 2),
	"cumulative_oil_mbbl" numeric(14, 4),
	"cumulative_gas_mmscf" numeric(14, 4),
	"cumulative_water_mbbl" numeric(14, 4),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "basins" ADD CONSTRAINT "basins_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fields" ADD CONSTRAINT "fields_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fields" ADD CONSTRAINT "fields_basin_id_basins_id_fk" FOREIGN KEY ("basin_id") REFERENCES "basins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reservoirs" ADD CONSTRAINT "reservoirs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reservoirs" ADD CONSTRAINT "reservoirs_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wells" ADD CONSTRAINT "wells_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wells" ADD CONSTRAINT "wells_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wells" ADD CONSTRAINT "wells_primary_reservoir_id_reservoirs_id_fk" FOREIGN KEY ("primary_reservoir_id") REFERENCES "reservoirs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
