-- ================================================================
-- SAKYAN — Step 0: Full Database Cleanup
-- Drops ALL tables (Django leftovers + any Sakyan tables)
-- Run this in Supabase SQL Editor BEFORE running 01_schema.sql
-- ================================================================

-- ── Django legacy tables ──────────────────────────────────────
DROP TABLE IF EXISTS users_user_user_permissions CASCADE;
DROP TABLE IF EXISTS users_user_groups CASCADE;
DROP TABLE IF EXISTS users_user CASCADE;
DROP TABLE IF EXISTS socialaccount_socialtoken CASCADE;
DROP TABLE IF EXISTS socialaccount_socialapp CASCADE;
DROP TABLE IF EXISTS socialaccount_socialaccount CASCADE;
DROP TABLE IF EXISTS django_session CASCADE;
DROP TABLE IF EXISTS django_migrations CASCADE;
DROP TABLE IF EXISTS django_content_type CASCADE;
DROP TABLE IF EXISTS django_admin_log CASCADE;
DROP TABLE IF EXISTS cars_carimage CASCADE;
DROP TABLE IF EXISTS cars_car CASCADE;
DROP TABLE IF EXISTS authtoken_token CASCADE;
DROP TABLE IF EXISTS auth_permission CASCADE;
DROP TABLE IF EXISTS auth_group_permissions CASCADE;
DROP TABLE IF EXISTS auth_group CASCADE;
DROP TABLE IF EXISTS account_emailconfirmation CASCADE;
DROP TABLE IF EXISTS account_emailaddress CASCADE;

-- ── Sakyan tables (in case of re-run) ─────────────────────────
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS car_images CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- ── Laravel default tables (in case they exist) ───────────────
DROP TABLE IF EXISTS migrations CASCADE;
DROP TABLE IF EXISTS cache CASCADE;
DROP TABLE IF EXISTS cache_locks CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS job_batches CASCADE;
DROP TABLE IF EXISTS failed_jobs CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- ── Users table (managed by Supabase Auth — only drop public copy) ──
DROP TABLE IF EXISTS users CASCADE;

-- ── Verify: should return 0 rows ─────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
