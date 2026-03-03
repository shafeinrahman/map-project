-- Enable pgcrypto for bcrypt-compatible password hashing via crypt/gen_salt.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add password hash column required for DB-backed login.
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Normalize role/status values for existing users.
UPDATE "user"
SET role = COALESCE(NULLIF(TRIM(role), ''), 'viewer');

UPDATE "user"
SET status = COALESCE(NULLIF(TRIM(status), ''), 'active');

-- Seed RBAC bootstrap users if missing.
INSERT INTO "user" (full_name, email, role, status, created_at, updated_at, password_hash)
SELECT
  'Admin User',
  'admin@internal-maps.local',
  'admin',
  'active',
  NOW(),
  NOW(),
  crypt('change-me-admin', gen_salt('bf', 10))
WHERE NOT EXISTS (
  SELECT 1 FROM "user" WHERE LOWER(email) = 'admin@internal-maps.local'
);

INSERT INTO "user" (full_name, email, role, status, created_at, updated_at, password_hash)
SELECT
  'Editor User',
  'editor@internal-maps.local',
  'editor',
  'active',
  NOW(),
  NOW(),
  crypt('change-me-editor', gen_salt('bf', 10))
WHERE NOT EXISTS (
  SELECT 1 FROM "user" WHERE LOWER(email) = 'editor@internal-maps.local'
);

INSERT INTO "user" (full_name, email, role, status, created_at, updated_at, password_hash)
SELECT
  'Viewer User',
  'viewer@internal-maps.local',
  'viewer',
  'active',
  NOW(),
  NOW(),
  crypt('change-me-viewer', gen_salt('bf', 10))
WHERE NOT EXISTS (
  SELECT 1 FROM "user" WHERE LOWER(email) = 'viewer@internal-maps.local'
);

-- Backfill password hashes for any existing users still missing one.
UPDATE "user"
SET password_hash = crypt('change-me', gen_salt('bf', 10))
WHERE password_hash IS NULL OR TRIM(password_hash) = '';
