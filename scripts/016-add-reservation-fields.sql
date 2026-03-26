-- Add reservation fields to tables table
-- This migration adds support for capturing reservation details

ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS reserved_by_staff_id INT;
ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS reserved_for_customer_name VARCHAR(255);
ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS reserved_for_customer_phone VARCHAR(20);
ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS reserved_notes TEXT;
ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index for faster queries on reservation-related fields
CREATE INDEX IF NOT EXISTS idx_tables_reserved_for_customer_name ON "tables"(reserved_for_customer_name);
CREATE INDEX IF NOT EXISTS idx_tables_reserved_from_to ON "tables"(reserved_from, reserved_to);
