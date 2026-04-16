-- Script to update all MAC addresses to use colon format (D0:46:0C:8B:9B:C0)
-- Run this directly in pgAdmin, DBeaver, or psql

-- First, let's see current MAC addresses (preview)
SELECT id, "assetTag", "macAddress"
FROM assets
WHERE "macAddress" IS NOT NULL;

-- Update MAC addresses: Replace hyphens with colons and convert to uppercase
UPDATE assets
SET "macAddress" = UPPER(REPLACE("macAddress", '-', ':'))
WHERE "macAddress" IS NOT NULL
  AND "macAddress" LIKE '%-%';

-- Verify the update
SELECT id, "assetTag", "macAddress"
FROM assets
WHERE "macAddress" IS NOT NULL;
