const fs = require('fs');
const path = require('path');

const env = require('../src/config/env');
const db = require('../src/db/postgres');
const logger = require('../src/config/logger');

const migrationsDir = path.resolve(__dirname, '../migrations');

const ensureMigrationsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getAppliedVersions = async () => {
  const result = await db.query('SELECT version FROM schema_migrations');
  return new Set(result.rows.map((row) => row.version));
};

const applyMigration = async (version, sqlContent) => {
  await db.query('BEGIN');

  try {
    await db.query(sqlContent);
    await db.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
};

const run = async () => {
  if (env.persistenceMode !== 'postgres') {
    logger.info('Skipping migrations: persistence mode is not postgres.');
    return;
  }

  if (!fs.existsSync(migrationsDir)) {
    logger.info('No migrations directory found. Skipping.');
    return;
  }

  await ensureMigrationsTable();

  const applied = await getAppliedVersions();
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  for (const fileName of migrationFiles) {
    if (applied.has(fileName)) {
      continue;
    }

    const filePath = path.join(migrationsDir, fileName);
    const sqlContent = fs.readFileSync(filePath, 'utf-8');

    logger.info(`Applying migration ${fileName}...`);
    await applyMigration(fileName, sqlContent);
    logger.info(`Applied migration ${fileName}.`);
  }
};

run()
  .then(async () => {
    await db.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Migration failed:', error);
    await db.close();
    process.exit(1);
  });
