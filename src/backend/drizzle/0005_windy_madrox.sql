DO $$ BEGIN
 CREATE TYPE "data_source_status" AS ENUM('ACTIVE', 'INACTIVE', 'ERROR', 'MAINTENANCE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "edge_gateway_status" AS ENUM('ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "protocol_type" AS ENUM('MODBUS_TCP', 'MODBUS_RTU', 'ETHERNET_IP', 'S7', 'OPCUA', 'FINS', 'MQTT', 'HTTP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tag_data_type" AS ENUM('INT16', 'UINT16', 'INT32', 'UINT32', 'FLOAT32', 'FLOAT64', 'BOOLEAN', 'STRING');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_source_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"data_source_id" uuid NOT NULL,
	"tag_id" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"asset_id" uuid,
	"telemetry_key" varchar(100),
	"protocol_config" jsonb NOT NULL,
	"data_type" "tag_data_type" NOT NULL,
	"unit" varchar(30),
	"scale_factor" numeric(10, 4) DEFAULT '1.0',
	"offset" numeric(10, 4) DEFAULT '0.0',
	"deadband" numeric(10, 4),
	"min_value" numeric(20, 6),
	"max_value" numeric(20, 6),
	"scan_rate" integer,
	"enabled" boolean DEFAULT true,
	"current_value" jsonb,
	"current_quality" "telemetry_quality",
	"last_read_at" timestamp,
	"tags" text[],
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"edge_gateway_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"protocol" "protocol_type" NOT NULL,
	"connection_config" jsonb DEFAULT '{}' NOT NULL,
	"status" "data_source_status" DEFAULT 'INACTIVE' NOT NULL,
	"last_successful_read" timestamp,
	"last_error" text,
	"last_error_at" timestamp,
	"error_count" integer DEFAULT 0,
	"avg_latency_ms" integer,
	"success_rate" numeric(5, 2),
	"enabled" boolean DEFAULT true,
	"scan_rate" integer DEFAULT 5000,
	"tags" text[],
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "edge_gateways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"gateway_id" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"site_id" uuid,
	"location" varchar(200),
	"ip_address" varchar(45),
	"port" integer DEFAULT 3001,
	"status" "edge_gateway_status" DEFAULT 'OFFLINE' NOT NULL,
	"last_heartbeat" timestamp,
	"last_config_sync" timestamp,
	"version" varchar(20),
	"config" jsonb DEFAULT '{}' NOT NULL,
	"tags" text[],
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "edge_gateways_gateway_id_unique" UNIQUE("gateway_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_source_tags" ADD CONSTRAINT "data_source_tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_source_tags" ADD CONSTRAINT "data_source_tags_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_source_tags" ADD CONSTRAINT "data_source_tags_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_source_tags" ADD CONSTRAINT "data_source_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_edge_gateway_id_edge_gateways_id_fk" FOREIGN KEY ("edge_gateway_id") REFERENCES "edge_gateways"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edge_gateways" ADD CONSTRAINT "edge_gateways_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edge_gateways" ADD CONSTRAINT "edge_gateways_site_id_assets_id_fk" FOREIGN KEY ("site_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edge_gateways" ADD CONSTRAINT "edge_gateways_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
