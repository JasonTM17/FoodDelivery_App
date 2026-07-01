-- Batch 4 web portal: additive schema for approvals, staff, promotions,
-- support operations, exports, settings, KYC, and analytics indexes.

ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'waiting_customer';
ALTER TYPE "PromotionType" ADD VALUE IF NOT EXISTS 'bogo';
ALTER TYPE "PromotionType" ADD VALUE IF NOT EXISTS 'combo';

DO $$ BEGIN CREATE TYPE "RestaurantApprovalStatus" AS ENUM ('pending', 'approved', 'changes_requested', 'rejected', 'suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "StaffRole" AS ENUM ('owner', 'manager', 'kitchen', 'cashier', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "StaffInviteStatus" AS ENUM ('pending', 'accepted', 'expired', 'revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "StaffShiftStatus" AS ENUM ('scheduled', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PromotionStatus" AS ENUM ('draft', 'scheduled', 'active', 'paused', 'expired', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SupportChannel" AS ENUM ('ai_chat', 'email', 'phone', 'in_app'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SupportMessageType" AS ENUM ('public_reply', 'internal_note', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ExportJobStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ExportFormat" AS ENUM ('csv', 'xlsx', 'parquet'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "KycStatus" AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "restaurant_profiles"
  ADD COLUMN IF NOT EXISTS "staff_role" "StaffRole" NOT NULL DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMPTZ;

ALTER TABLE "restaurants"
  ADD COLUMN IF NOT EXISTS "approval_status" "RestaurantApprovalStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "approval_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "approved_by_id" UUID,
  ADD COLUMN IF NOT EXISTS "onboarding_state" JSONB,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE "restaurants"
SET "approval_status" = 'approved', "approved_at" = COALESCE("approved_at", "created_at")
WHERE "is_active" = true AND "approval_status" = 'pending';

ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "parent_id" UUID,
  ADD COLUMN IF NOT EXISTS "icon" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "is_visible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE "menu_items"
  ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "staff_invites" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurant_id" UUID NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) NOT NULL,
  "role" "StaffRole" NOT NULL,
  "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "token_hash" VARCHAR(128) NOT NULL UNIQUE,
  "status" "StaffInviteStatus" NOT NULL DEFAULT 'pending',
  "invited_by_id" UUID NOT NULL REFERENCES "users"("id"),
  "expires_at" TIMESTAMPTZ NOT NULL,
  "accepted_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "staff_shifts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurant_id" UUID NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "restaurant_profile_id" UUID NOT NULL REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "status" "StaffShiftStatus" NOT NULL DEFAULT 'scheduled',
  "note" VARCHAR(300),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "staff_shifts_time_check" CHECK ("ends_at" > "starts_at")
);

ALTER TABLE "promotions"
  ADD COLUMN IF NOT EXISTS "name" VARCHAR(150) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "PromotionStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "is_stackable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "budget" DECIMAL(12,0),
  ADD COLUMN IF NOT EXISTS "used_budget" DECIMAL(12,0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "recurrence" JSONB,
  ADD COLUMN IF NOT EXISTS "targeting" JSONB,
  ADD COLUMN IF NOT EXISTS "channels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "created_by_id" UUID,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE "promotions" SET "name" = "code" WHERE "name" = '';

DO $$ BEGIN
  ALTER TABLE "promotions" ADD CONSTRAINT "promotions_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "promotion_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "promotion_id" UUID NOT NULL REFERENCES "promotions"("id") ON DELETE CASCADE,
  "menu_item_id" UUID REFERENCES "menu_items"("id") ON DELETE CASCADE,
  "category_id" UUID REFERENCES "categories"("id") ON DELETE CASCADE,
  CONSTRAINT "promotion_items_scope_check" CHECK ("menu_item_id" IS NOT NULL OR "category_id" IS NOT NULL)
);

DROP INDEX IF EXISTS "promotion_usages_promotion_id_user_id_key";

ALTER TABLE "ai_support_tickets"
  ADD COLUMN IF NOT EXISTS "channel" "SupportChannel" NOT NULL DEFAULT 'in_app',
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "first_responded_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "waiting_started_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "sla_deadline_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN
  ALTER TABLE "ai_support_tickets" ADD CONSTRAINT "ai_support_tickets_assigned_admin_id_fkey"
    FOREIGN KEY ("assigned_admin_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "support_ticket_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL REFERENCES "ai_support_tickets"("id") ON DELETE CASCADE,
  "sender_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "type" "SupportMessageType" NOT NULL DEFAULT 'public_reply',
  "body" TEXT NOT NULL,
  "attachments" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "support_macros" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "body" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "support_csat_responses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL UNIQUE REFERENCES "ai_support_tickets"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL,
  "rating" SMALLINT NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "comment" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "admin_audit_logs"
  ADD COLUMN IF NOT EXISTS "user_agent" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "correlation_id" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "severity" VARCHAR(20) NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS "metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "search_vector" TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', COALESCE("action", '') || ' ' || COALESCE("target_type", '') || ' ' || COALESCE("target_id"::text, '') || ' ' || COALESCE("correlation_id", ''))
  ) STORED;

CREATE TABLE IF NOT EXISTS "admin_export_jobs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "requested_by_id" UUID NOT NULL REFERENCES "users"("id"),
  "resource" VARCHAR(80) NOT NULL,
  "format" "ExportFormat" NOT NULL,
  "status" "ExportJobStatus" NOT NULL DEFAULT 'queued',
  "filters" JSONB,
  "progress" SMALLINT NOT NULL DEFAULT 0 CHECK ("progress" BETWEEN 0 AND 100),
  "file_url" VARCHAR(1000),
  "error_message" TEXT,
  "expires_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(120) NOT NULL UNIQUE,
  "value" JSONB NOT NULL,
  "updated_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "driver_kyc_submissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "driver_profile_id" UUID NOT NULL REFERENCES "driver_profiles"("id") ON DELETE CASCADE,
  "status" "KycStatus" NOT NULL DEFAULT 'pending',
  "document_urls" JSONB NOT NULL,
  "rejection_reason" TEXT,
  "reviewed_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "restaurant_profiles_restaurant_id_staff_role_is_active_idx" ON "restaurant_profiles"("restaurant_id", "staff_role", "is_active");
CREATE INDEX IF NOT EXISTS "restaurants_approval_status_created_at_idx" ON "restaurants"("approval_status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "categories_restaurant_id_parent_id_sort_order_idx" ON "categories"("restaurant_id", "parent_id", "sort_order");
CREATE INDEX IF NOT EXISTS "menu_items_restaurant_id_category_id_sort_order_idx" ON "menu_items"("restaurant_id", "category_id", "sort_order");
CREATE INDEX IF NOT EXISTS "staff_invites_restaurant_id_status_created_at_idx" ON "staff_invites"("restaurant_id", "status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "staff_invites_email_status_idx" ON "staff_invites"("email", "status");
CREATE INDEX IF NOT EXISTS "staff_shifts_restaurant_id_starts_at_ends_at_idx" ON "staff_shifts"("restaurant_id", "starts_at", "ends_at");
CREATE INDEX IF NOT EXISTS "staff_shifts_restaurant_profile_id_starts_at_idx" ON "staff_shifts"("restaurant_profile_id", "starts_at");
CREATE INDEX IF NOT EXISTS "promotions_restaurant_id_status_starts_at_expires_at_idx" ON "promotions"("restaurant_id", "status", "starts_at", "expires_at");
CREATE INDEX IF NOT EXISTS "promotions_status_starts_at_expires_at_idx" ON "promotions"("status", "starts_at", "expires_at");
CREATE INDEX IF NOT EXISTS "promotion_items_promotion_id_idx" ON "promotion_items"("promotion_id");
CREATE INDEX IF NOT EXISTS "promotion_items_menu_item_id_idx" ON "promotion_items"("menu_item_id");
CREATE INDEX IF NOT EXISTS "promotion_items_category_id_idx" ON "promotion_items"("category_id");
CREATE INDEX IF NOT EXISTS "promotion_usages_promotion_id_user_id_used_at_idx" ON "promotion_usages"("promotion_id", "user_id", "used_at" DESC);
CREATE INDEX IF NOT EXISTS "ai_support_tickets_status_priority_created_at_idx" ON "ai_support_tickets"("status", "priority", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "ai_support_tickets_assigned_admin_id_status_idx" ON "ai_support_tickets"("assigned_admin_id", "status");
CREATE INDEX IF NOT EXISTS "support_ticket_messages_ticket_id_created_at_idx" ON "support_ticket_messages"("ticket_id", "created_at");
CREATE INDEX IF NOT EXISTS "support_macros_is_active_name_idx" ON "support_macros"("is_active", "name");
CREATE INDEX IF NOT EXISTS "support_csat_responses_created_at_idx" ON "support_csat_responses"("created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_correlation_id_idx" ON "admin_audit_logs"("correlation_id");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_search_vector_idx" ON "admin_audit_logs" USING GIN ("search_vector");
CREATE INDEX IF NOT EXISTS "admin_export_jobs_requested_by_id_created_at_idx" ON "admin_export_jobs"("requested_by_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "admin_export_jobs_status_created_at_idx" ON "admin_export_jobs"("status", "created_at");
CREATE INDEX IF NOT EXISTS "driver_kyc_submissions_status_created_at_idx" ON "driver_kyc_submissions"("status", "created_at");
CREATE INDEX IF NOT EXISTS "driver_kyc_submissions_driver_profile_id_created_at_idx" ON "driver_kyc_submissions"("driver_profile_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "orders_restaurant_id_created_at_status_idx" ON "orders"("restaurant_id", "created_at" DESC, "status");
CREATE INDEX IF NOT EXISTS "order_items_menu_item_id_order_id_idx" ON "order_items"("menu_item_id", "order_id");
