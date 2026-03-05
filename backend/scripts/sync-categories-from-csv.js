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

const slugify = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const discoverCsvFiles = () => {
  const names = fs.readdirSync(workspaceRoot);

  return names
    .filter((name) => /business-import\.csv$/i.test(name) || /refactored\.csv$/i.test(name))
    .map((name) => path.join(workspaceRoot, name));
};

const getColumnIndex = (headerIndex, candidates) => {
  for (const candidate of candidates) {
    if (headerIndex.has(candidate)) {
      return headerIndex.get(candidate);
    }
  }

  return -1;
};

const extractFromNameSuffix = (businessName) => {
  const rawName = normalizeText(businessName);
  const splitAt = rawName.lastIndexOf(' - ');

  if (splitAt <= 0) {
    return null;
  }

  const retailerName = normalizeText(rawName.slice(0, splitAt));
  const channelType = normalizeText(rawName.slice(splitAt + 3));

  if (!retailerName || !channelType) {
    return null;
  }

  return {
    retailerName,
    channelType,
  };
};

const collectCategoryMappings = async (filePath, categoryToBusinessNames) => {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let lineNumber = 0;
  let headerIndex = null;
  let retailerColumn = -1;
  let businessNameColumn = -1;
  let channelTypeColumn = -1;

  for await (const line of reader) {
    lineNumber += 1;

    if (!line || !line.trim()) {
      continue;
    }

    const columns = parseCsvLine(line);

    if (lineNumber === 1) {
      headerIndex = new Map(columns.map((header, index) => [normalizeHeader(header), index]));

      retailerColumn = getColumnIndex(headerIndex, [
        'retailername',
        'retailer_name',
        'retailer name',
      ]);

      businessNameColumn = getColumnIndex(headerIndex, [
        'name',
        'business_name',
        'businessname',
      ]);

      channelTypeColumn = getColumnIndex(headerIndex, [
        'channeltype',
        'channel_type',
        'channel type',
      ]);

      continue;
    }

    const rawBusinessName = businessNameColumn >= 0 ? normalizeText(columns[businessNameColumn]) : '';
    const rawRetailerName = retailerColumn >= 0 ? normalizeText(columns[retailerColumn]) : '';
    const rawChannelType = channelTypeColumn >= 0 ? normalizeText(columns[channelTypeColumn]) : '';

    const suffixDetails = extractFromNameSuffix(rawBusinessName);
    const channelType = rawChannelType || suffixDetails?.channelType || '';

    if (!channelType) {
      continue;
    }

    const retailerName = rawRetailerName || suffixDetails?.retailerName || '';

    if (!categoryToBusinessNames.has(channelType)) {
      categoryToBusinessNames.set(channelType, new Set());
    }

    const names = categoryToBusinessNames.get(channelType);

    if (rawBusinessName) {
      names.add(rawBusinessName);
    }

    if (retailerName) {
      names.add(`${retailerName} - ${channelType}`);
    }
  }
};

const chunk = (items, size) => {
  const result = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
};

const syncCategories = async (categoryToBusinessNames) => {
  const categories = Array.from(categoryToBusinessNames.keys()).sort((left, right) =>
    left.localeCompare(right)
  );

  if (categories.length === 0) {
    return {
      createdCategories: 0,
      updatedBusinesses: 0,
      categoriesDiscovered: 0,
    };
  }

  await db.query('BEGIN');

  try {
    const existingResult = await db.query('SELECT category_id, name FROM category');
    const categoryIdByName = new Map(
      existingResult.rows.map((row) => [String(row.name || '').trim().toLowerCase(), Number(row.category_id)])
    );

    let createdCategories = 0;

    for (const categoryName of categories) {
      const normalizedKey = categoryName.toLowerCase();

      if (categoryIdByName.has(normalizedKey)) {
        continue;
      }

      const insertResult = await db.query(
        `
          INSERT INTO category (name, slug, icon_key, is_active, created_at, updated_at)
          VALUES ($1, $2, NULL, true, NOW(), NOW())
          RETURNING category_id
        `,
        [categoryName, slugify(categoryName)]
      );

      categoryIdByName.set(normalizedKey, Number(insertResult.rows[0].category_id));
      createdCategories += 1;
    }

    let updatedBusinesses = 0;

    for (const categoryName of categories) {
      const categoryId = categoryIdByName.get(categoryName.toLowerCase());
      const businessNames = Array.from(categoryToBusinessNames.get(categoryName) || []).filter(Boolean);

      if (!categoryId || businessNames.length === 0) {
        continue;
      }

      const normalizedNames = businessNames.map((name) => name.toLowerCase());

      for (const nameChunk of chunk(normalizedNames, 5000)) {
        const updateResult = await db.query(
          `
            UPDATE business
            SET
              category_id = $1,
              updated_at = NOW()
            WHERE LOWER(name) = ANY($2::text[])
          `,
          [categoryId, nameChunk]
        );

        updatedBusinesses += Number(updateResult.rowCount || 0);
      }
    }

    await db.query('COMMIT');

    return {
      createdCategories,
      updatedBusinesses,
      categoriesDiscovered: categories.length,
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
};

const run = async () => {
  if (env.persistenceMode !== 'postgres') {
    logger.info('Skipping category sync: persistence mode is not postgres.');
    return;
  }

  const providedPaths = process.argv.slice(2).map((arg) => path.resolve(arg));
  const csvFiles = providedPaths.length > 0 ? providedPaths : discoverCsvFiles();

  if (csvFiles.length === 0) {
    logger.info('No CSV files found for category sync.');
    return;
  }

  logger.info(`Scanning ${csvFiles.length} CSV files for channel types...`);

  const categoryToBusinessNames = new Map();

  for (const csvFile of csvFiles) {
    if (!fs.existsSync(csvFile)) {
      logger.info(`CSV file not found, skipping: ${csvFile}`);
      continue;
    }

    await collectCategoryMappings(csvFile, categoryToBusinessNames);
  }

  const summary = await syncCategories(categoryToBusinessNames);

  logger.info(
    `Category sync complete. discovered=${summary.categoriesDiscovered}, created=${summary.createdCategories}, business_updates=${summary.updatedBusinesses}`
  );
};

run()
  .then(async () => {
    await db.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Category sync failed:', error);
    await db.close();
    process.exit(1);
  });
