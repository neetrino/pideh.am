CREATE TABLE "admin_push_subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"locale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_push_subscriptions" ADD CONSTRAINT "admin_push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_push_subscriptions_endpoint_uidx" ON "admin_push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "admin_push_subscriptions_user_idx" ON "admin_push_subscriptions" USING btree ("user_id");
