DO $$ BEGIN
 CREATE TYPE "alarm_severity" AS ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "alarm_status" AS ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "asset_status" AS ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED', 'FAILED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "rule_action_type" AS ENUM('SET_COMPUTED', 'SET_ATTRIBUTE', 'SET_STATUS', 'CREATE_ALARM', 'SEND_NOTIFICATION', 'CALL_API', 'PUBLISH_KAFKA', 'LOG');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "rule_status" AS ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'ERROR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "rule_trigger_type" AS ENUM('TELEMETRY_CHANGE', 'ATTRIBUTE_CHANGE', 'STATUS_CHANGE', 'SCHEDULE', 'EVENT', 'MANUAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "telemetry_quality" AS ENUM('GOOD', 'BAD', 'UNCERTAIN', 'SIMULATED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "telemetry_source" AS ENUM('SENSOR', 'MANUAL', 'CALCULATED', 'IMPORTED', 'EDGE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alarms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid,
	"rule_id" uuid,
	"alarm_code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"message" text,
	"severity" "alarm_severity" DEFAULT 'MEDIUM' NOT NULL,
	"status" "alarm_status" DEFAULT 'ACTIVE' NOT NULL,
	"trigger_value" jsonb,
	"trigger_condition" text,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp,
	"acknowledged_by" uuid,
	"resolved_at" timestamp,
	"resolved_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_attribute_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"attribute_key" varchar(100) NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"changed_by" uuid,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_asset_id" uuid NOT NULL,
	"target_asset_id" uuid NOT NULL,
	"relationship_type" varchar(50) NOT NULL,
	"valid_from" timestamp DEFAULT now(),
	"valid_to" timestamp,
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_telemetry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time" timestamp with time zone DEFAULT now() NOT NULL,
	"asset_id" uuid NOT NULL,
	"telemetry_key" varchar(100) NOT NULL,
	"value_numeric" numeric(20, 6),
	"value_text" text,
	"value_boolean" boolean,
	"quality" "telemetry_quality" DEFAULT 'GOOD',
	"source" "telemetry_source" DEFAULT 'SENSOR',
	"source_id" varchar(100),
	"unit" varchar(30)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"color" varchar(20),
	"parent_type_id" uuid,
	"fixed_schema" jsonb DEFAULT '{}' NOT NULL,
	"attribute_schema" jsonb DEFAULT '{}' NOT NULL,
	"telemetry_schema" jsonb DEFAULT '{}' NOT NULL,
	"computed_fields" jsonb DEFAULT '[]' NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_system" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_type_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"parent_asset_id" uuid,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"elevation_ft" numeric(10, 2),
	"status" "asset_status" DEFAULT 'ACTIVE' NOT NULL,
	"properties" jsonb DEFAULT '{}' NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"computed_values" jsonb DEFAULT '{}' NOT NULL,
	"computed_at" timestamp,
	"current_telemetry" jsonb DEFAULT '{}' NOT NULL,
	"telemetry_updated_at" timestamp,
	"tags" text[],
	"metadata" jsonb,
	"legacy_type" varchar(50),
	"legacy_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rule_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"asset_id" uuid,
	"trigger_type" "rule_trigger_type" NOT NULL,
	"trigger_data" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	"success" boolean NOT NULL,
	"result" jsonb,
	"error" text,
	"actions_executed" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"applies_to_asset_types" text[] NOT NULL,
	"applies_to_assets" uuid[],
	"nodes" jsonb NOT NULL,
	"connections" jsonb NOT NULL,
	"status" "rule_status" DEFAULT 'DRAFT' NOT NULL,
	"priority" integer DEFAULT 0,
	"config" jsonb DEFAULT '{
    "executeOnStartup": false,
    "debounceMs": 1000,
    "maxExecutionsPerMinute": 60,
    "timeoutMs": 5000
  }' NOT NULL,
	"last_error" text,
	"last_error_at" timestamp,
	"error_count" integer DEFAULT 0,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alarms" ADD CONSTRAINT "alarms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alarms" ADD CONSTRAINT "alarms_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alarms" ADD CONSTRAINT "alarms_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alarms" ADD CONSTRAINT "alarms_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alarms" ADD CONSTRAINT "alarms_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_attribute_history" ADD CONSTRAINT "asset_attribute_history_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_attribute_history" ADD CONSTRAINT "asset_attribute_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_source_asset_id_assets_id_fk" FOREIGN KEY ("source_asset_id") REFERENCES "assets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_target_asset_id_assets_id_fk" FOREIGN KEY ("target_asset_id") REFERENCES "assets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_telemetry" ADD CONSTRAINT "asset_telemetry_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_types" ADD CONSTRAINT "asset_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_types" ADD CONSTRAINT "asset_types_parent_type_id_asset_types_id_fk" FOREIGN KEY ("parent_type_id") REFERENCES "asset_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_asset_type_id_asset_types_id_fk" FOREIGN KEY ("asset_type_id") REFERENCES "asset_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_parent_asset_id_assets_id_fk" FOREIGN KEY ("parent_asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rule_executions" ADD CONSTRAINT "rule_executions_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rule_executions" ADD CONSTRAINT "rule_executions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rules" ADD CONSTRAINT "rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rules" ADD CONSTRAINT "rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
