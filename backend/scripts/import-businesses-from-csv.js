const fs = require('fs');
const path = require('path');
const readline = require('readline');

const env = require('../src/config/env');
const db = require('../src/db/postgres');
const logger = require('../src/config/logger');

const workspaceRoot = path.resolve(__dirname, '../..');

const parseCsvLine = (line) => {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];

      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);

  return fields.map((value) => value.trim());
};

const normalizeHeader = (header) => String(header || '').trim().toLowerCase();
const normalizeText = (value) => String(value || '').trim();

const importBusinesses = async (filePath) => {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let lineNumber = 0;
  let headerIndex = null;
  let nameColumn = -1;
  let addressColumn = -1;
  let statusColumn = -1;
  let latitudeColumn = -1;
  let longitudeColumn = -1;
  let createdAtColumn = -1;
  let updatedAtColumn = -1;

  const businesses = [];

  for await (const line of reader) {
    lineNumber += 1;

    if (!line || !line.trim()) {
      continue;
    }

    const columns = parseCsvLine(line);

    if (lineNumber === 1) {
      headerIndex = new Map(columns.map((header, index) => [normalizeHeader(header), index]));

      nameColumn = headerIndex.get('name') ?? -1;
      addressColumn = headerIndex.get('address_text') ?? -1;
      statusColumn = headerIndex.get('status') ?? -1;
      latitudeColumn = headerIndex.get('latitude') ?? -1;
      longitudeColumn = headerIndex.get('longitude') ?? -1;
      createdAtColumn = headerIndex.get('created_at') ?? -1;
      updatedAtColumn = headerIndex.get('updated_at') ?? -1;

      if (nameColumn < 0) {
        throw new Error('CSV must have a "name" column');
      }

      logger.info('CSV headers detected:', {
        name: nameColumn >= 0,
        address_text: addressColumn >= 0,
        status: statusColumn >= 0,
        latitude: latitudeColumn >= 0,
        longitude: longitudeColumn >= 0,
        created_at: createdAtColumn >= 0,
        updated_at: updatedAtColumn >= 0,
      });

      continue;
    }

    const business = {
      name: nameColumn >= 0 ? normalizeText(columns[nameColumn]) : null,
      address_text: addressColumn >= 0 ? normalizeText(columns[addressColumn]) : null,
      status: statusColumn >= 0 ? normalizeText(columns[statusColumn]) : 'active',
      latitude: latitudeColumn >= 0 ? parseFloat(columns[latitudeColumn]) : null,
      longitude: longitudeColumn >= 0 ? parseFloat(columns[longitudeColumn]) : null,
      created_at: createdAtColumn >= 0 ? normalizeText(columns[createdAtColumn]) : new Date().toISOString(),
      updated_at: updatedAtColumn >= 0 ? normalizeText(columns[updatedAtColumn]) : new Date().toISOString(),
    };

    if (!business.name) {
      logger.warn(`Line ${lineNumber}: Skipping row with empty name`);
      continue;
    }

    businesses.push(business);
  }

  if (businesses.length === 0) {
    logger.info('No businesses to import');
    return {
      imported: 0,
      skipped: 0,
      errors: 0,
    };
  }

  logger.info(`Importing ${businesses.length} businesses from ${path.basename(filePath)}...`);

  await db.query('BEGIN');

  try {
    let imported = 0;
    let errors = 0;

    for (const business of businesses) {
      try {
        const result = await db.query(
          `
            INSERT INTO business (name, address_text, status, latitude, longitude, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (name) DO UPDATE SET
              address_text = EXCLUDED.address_text,
              status = EXCLUDED.status,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              updated_at = EXCLUDED.updated_at
            RETURNING business_id
          `,
          [
            business.name,
            business.address_text,
            business.status,
            business.latitude,
            business.longitude,
            business.created_at,
            business.updated_at,
          ]
        );

        imported += 1;

        if (imported % 100 === 0) {
          logger.info(`Progress: ${imported}/${businesses.length} imported`);
        }
      } catch (error) {
        errors += 1;
        logger.error(`Error importing business "${business.name}":`, error.message);
      }
    }

    await db.query('COMMIT');

    return {
      imported,
      skipped: businesses.length - imported - errors,
      errors,
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
};

const run = async () => {
  if (env.persistenceMode !== 'postgres') {
    logger.info('Skipping business import: persistence mode is not postgres.');
    return;
  }

  const providedPaths = process.argv.slice(2).map((arg) => path.resolve(arg));

  if (providedPaths.length === 0) {
    logger.error('Please provide at least one CSV file path as an argument');
    process.exit(1);
  }

  for (const filePath of providedPaths) {
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      continue;
    }

    const summary = await importBusinesses(filePath);

    logger.info(
      `Business import complete. imported=${summary.imported}, skipped=${summary.skipped}, errors=${summary.errors}`
    );
  }
};

run()
  .then(async () => {
    await db.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Import failed:', error);

    try {
      await db.close();
    } catch (closeError) {
      logger.error('Error closing database:', closeError);
    }

    process.exit(1);
  });
