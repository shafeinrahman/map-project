-- Enable pgcrypto for bcrypt-compatible password hashing via crypt/gen_salt.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add password hash column required for DB-backed login.
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Normalize role/status values for existing users.
UPDATE "user"
SET role = COALESCE(NULLIF(TRIM(role), ''), 'delivery');

UPDATE "user"
SET status = COALESCE(NULLIF(TRIM(status), ''), 'active');

-- Seed RBAC bootstrap users if missing.
INSERT INTO "user" (full_name, email, role, status, created_at, updated_at, password_hash)
SELECT
  'Super Admin User',
  'super-admin@internal-maps.local',
  'super-admin',
  'active',
  NOW(),
  NOW(),
  crypt('change-me-admin', gen_salt('bf', 10))
WHERE NOT EXISTS (
  SELECT 1 FROM "user" WHERE LOWER(email) = 'super-admin@internal-maps.local'
);

INSERT INTO "user" (full_name, email, role, status, created_at, updated_at, password_hash)
SELECT
  'Business Admin User',
  'business-admin@internal-maps.local',
  'business-admin',
  'active',
  NOW(),
  NOW(),
  crypt('change-me-business-admin', gen_salt('bf', 10))
WHERE NOT EXISTS (
  SELECT 1 FROM "user" WHERE LOWER(email) = 'business-admin@internal-maps.local'
);

INSERT INTO "user" (full_name, email, role, status, created_at, updated_at, password_hash)
SELECT
  'Delivery User',
  'delivery@internal-maps.local',
  'delivery',
  'active',
  NOW(),
  NOW(),
  crypt('change-me-delivery', gen_salt('bf', 10))
WHERE NOT EXISTS (
  SELECT 1 FROM "user" WHERE LOWER(email) = 'delivery@internal-maps.local'
);

-- Backfill password hashes for any existing users still missing one.
UPDATE "user"
SET password_hash = crypt('change-me', gen_salt('bf', 10))
WHERE password_hash IS NULL OR TRIM(password_hash) = '';
