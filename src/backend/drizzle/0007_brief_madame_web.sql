DO $$ BEGIN
 CREATE TYPE "digital_twin_status" AS ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "transport_type" AS ENUM('MODBUS_TCP', 'MODBUS_RTU', 'ETHERNET_IP', 'S7', 'OPCUA', 'FINS', 'MQTT', 'HTTP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"root_asset_type_id" uuid NOT NULL,
	"components" jsonb DEFAULT '[]' NOT NULL,
	"relationships" jsonb DEFAULT '[]' NOT NULL,
	"default_properties" jsonb DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tags" text[],
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connectivity_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"device_profile_id" uuid NOT NULL,
	"asset_template_id" uuid NOT NULL,
	"rule_chain_id" uuid,
	"mappings" jsonb DEFAULT '[]' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tags" text[],
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"data_source_id" uuid NOT NULL,
	"digital_twin_id" uuid NOT NULL,
	"connectivity_profile_id" uuid NOT NULL,
	"custom_rule_chain_id" uuid,
	"custom_mappings" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_data_received_at" timestamp,
	"last_mapping_error" text,
	"last_mapping_error_at" timestamp,
	"tags" text[],
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"transport_type" "transport_type" NOT NULL,
	"telemetry_schema" jsonb DEFAULT '{}' NOT NULL,
	"default_rule_chain_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"tags" text[],
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "digital_twin_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_template_id" uuid,
	"code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"root_thing_id" varchar(200) NOT NULL,
	"component_thing_ids" jsonb DEFAULT '{}' NOT NULL,
	"status" "digital_twin_status" DEFAULT 'ACTIVE' NOT NULL,
	"tags" text[],
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "basins";--> statement-breakpoint
DROP TABLE "fields";--> statement-breakpoint
DROP TABLE "reservoirs";--> statement-breakpoint
DROP TABLE "wells";--> statement-breakpoint
ALTER TABLE "nodal_analyses" DROP CONSTRAINT "nodal_analyses_well_id_wells_id_fk";
--> statement-breakpoint
ALTER TABLE "vlp_analyses" DROP CONSTRAINT "vlp_analyses_well_id_wells_id_fk";
--> statement-breakpoint
ALTER TABLE "well_plans" DROP CONSTRAINT "well_plans_well_id_wells_id_fk";
--> statement-breakpoint
ALTER TABLE "well_tests" DROP CONSTRAINT "well_tests_well_id_wells_id_fk";
--> statement-breakpoint
ALTER TABLE "nodal_analyses" ALTER COLUMN "well_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "vlp_analyses" ALTER COLUMN "well_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "well_plans" ALTER COLUMN "well_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "well_tests" ALTER COLUMN "well_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "data_sources" ADD COLUMN "device_profile_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_device_profile_id_device_profiles_id_fk" FOREIGN KEY ("device_profile_id") REFERENCES "device_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_templates" ADD CONSTRAINT "asset_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_templates" ADD CONSTRAINT "asset_templates_root_asset_type_id_asset_types_id_fk" FOREIGN KEY ("root_asset_type_id") REFERENCES "asset_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_templates" ADD CONSTRAINT "asset_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connectivity_profiles" ADD CONSTRAINT "connectivity_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connectivity_profiles" ADD CONSTRAINT "connectivity_profiles_device_profile_id_device_profiles_id_fk" FOREIGN KEY ("device_profile_id") REFERENCES "device_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connectivity_profiles" ADD CONSTRAINT "connectivity_profiles_asset_template_id_asset_templates_id_fk" FOREIGN KEY ("asset_template_id") REFERENCES "asset_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connectivity_profiles" ADD CONSTRAINT "connectivity_profiles_rule_chain_id_rules_id_fk" FOREIGN KEY ("rule_chain_id") REFERENCES "rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connectivity_profiles" ADD CONSTRAINT "connectivity_profiles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_bindings" ADD CONSTRAINT "device_bindings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_bindings" ADD CONSTRAINT "device_bindings_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_bindings" ADD CONSTRAINT "device_bindings_digital_twin_id_digital_twin_instances_id_fk" FOREIGN KEY ("digital_twin_id") REFERENCES "digital_twin_instances"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_bindings" ADD CONSTRAINT "device_bindings_connectivity_profile_id_connectivity_profiles_id_fk" FOREIGN KEY ("connectivity_profile_id") REFERENCES "connectivity_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_bindings" ADD CONSTRAINT "device_bindings_custom_rule_chain_id_rules_id_fk" FOREIGN KEY ("custom_rule_chain_id") REFERENCES "rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_bindings" ADD CONSTRAINT "device_bindings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_profiles" ADD CONSTRAINT "device_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_profiles" ADD CONSTRAINT "device_profiles_default_rule_chain_id_rules_id_fk" FOREIGN KEY ("default_rule_chain_id") REFERENCES "rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_profiles" ADD CONSTRAINT "device_profiles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "digital_twin_instances" ADD CONSTRAINT "digital_twin_instances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "digital_twin_instances" ADD CONSTRAINT "digital_twin_instances_asset_template_id_asset_templates_id_fk" FOREIGN KEY ("asset_template_id") REFERENCES "asset_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "digital_twin_instances" ADD CONSTRAINT "digital_twin_instances_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
