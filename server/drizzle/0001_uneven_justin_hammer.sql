CREATE TABLE "entity_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"table_name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entity_definitions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "entity_definitions_table_name_unique" UNIQUE("table_name")
);
--> statement-breakpoint
CREATE TABLE "field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"name" text NOT NULL,
	"column_name" text NOT NULL,
	"field_type" text NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"unique" boolean DEFAULT false NOT NULL,
	"default_value" text,
	"options" jsonb,
	"validation" jsonb,
	"ui_config" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "field_definitions" ADD CONSTRAINT "field_definitions_entity_id_entity_definitions_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entity_defs_slug_idx" ON "entity_definitions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "field_defs_entity_id_idx" ON "field_definitions" USING btree ("entity_id");