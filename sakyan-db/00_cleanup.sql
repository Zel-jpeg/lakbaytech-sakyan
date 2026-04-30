-- ============================================================
-- SAKYAN — Step 0: Clean ALL tables (custom + Laravel defaults)
-- Run this FIRST in Supabase SQL Editor
-- ⚠️ This drops ALL tables in the public schema
-- ============================================================

-- Drop Sakyan custom tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS car_images CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- Drop Laravel default tables (auto-created on first boot)
DROP TABLE IF EXISTS migrations CASCADE;
DROP TABLE IF EXISTS cache CASCADE;
DROP TABLE IF EXISTS cache_locks CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS job_batches CASCADE;
DROP TABLE IF EXISTS failed_jobs CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Confirm clean (should return 0 rows)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
