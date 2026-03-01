// Import PostgreSQL query helper.
const db = require('../../db/postgres');

// Convert mixed numeric values to finite numbers.
const toFiniteNumber = (value) => {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Convert a DB row to API business shape.
const mapBusinessRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    businessId: Number(row.business_id),
    name: row.name,
    addressText: row.address_text,
    categoryId: toFiniteNumber(row.category_id),
    routeId: toFiniteNumber(row.route_id),
    territoryId: toFiniteNumber(row.territory_id),
    status: row.status,
    priority: toFiniteNumber(row.priority),
    createdAt: row.created_at,
    createdBy: toFiniteNumber(row.created_by),
    updatedAt: row.updated_at,
    updatedBy: toFiniteNumber(row.updated_by),
    lastQueriedAt: row.last_queried_at,
    latitude: toFiniteNumber(row.latitude),
    longitude: toFiniteNumber(row.longitude),
  };
};

// Build SQL filter clauses with parameter bindings.
const buildWhereClause = (filters = {}) => {
  const clauses = [];
  const params = [];

  const add = (sql, value) => {
    params.push(value);
    clauses.push(`${sql} $${params.length}`);
  };

  if (filters.status) {
    add('status =', String(filters.status).trim().toLowerCase());
  }

  if (filters.categoryId != null) {
    add('category_id =', Number(filters.categoryId));
  }

  if (filters.routeId != null) {
    add('route_id =', Number(filters.routeId));
  }

  if (filters.territoryId != null) {
    add('territory_id =', Number(filters.territoryId));
  }

  if (filters.minLat != null) {
    add('latitude >=', Number(filters.minLat));
  }

  if (filters.maxLat != null) {
    add('latitude <=', Number(filters.maxLat));
  }

  if (filters.minLng != null) {
    add('longitude >=', Number(filters.minLng));
  }

  if (filters.maxLng != null) {
    add('longitude <=', Number(filters.maxLng));
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return { whereClause, params };
};

// Return filtered and paginated businesses.
const listBusinesses = async ({
  status,
  categoryId,
  routeId,
  territoryId,
  minLat,
  maxLat,
  minLng,
  maxLng,
  limit = 100,
  offset = 0,
} = {}) => {
  const sanitizedLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const sanitizedOffset = Math.max(0, Number(offset) || 0);

  const { whereClause, params } = buildWhereClause({
    status,
    categoryId,
    routeId,
    territoryId,
    minLat,
    maxLat,
    minLng,
    maxLng,
  });

  const totalResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM business ${whereClause}`,
    params
  );

  const listParams = [...params, sanitizedLimit, sanitizedOffset];

  const listResult = await db.query(
    `
      SELECT
        business_id,
        name,
        address_text,
        category_id,
        route_id,
        territory_id,
        status,
        priority,
        created_at,
        created_by,
        updated_at,
        updated_by,
        last_queried_at,
        latitude,
        longitude
      FROM business
      ${whereClause}
      ORDER BY business_id ASC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    listParams
  );

  return {
    items: listResult.rows.map(mapBusinessRow),
    pagination: {
      total: totalResult.rows[0]?.total || 0,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    },
  };
};

// Find one business by identifier.
const getBusinessById = async (businessId) => {
  const result = await db.query(
    `
      SELECT
        business_id,
        name,
        address_text,
        category_id,
        route_id,
        territory_id,
        status,
        priority,
        created_at,
        created_by,
        updated_at,
        updated_by,
        last_queried_at,
        latitude,
        longitude
      FROM business
      WHERE business_id = $1
    `,
    [Number(businessId)]
  );

  return mapBusinessRow(result.rows[0]);
};

// Create one business record.
const createBusiness = async (payload, actorUserId) => {
  const now = new Date().toISOString();

  const result = await db.query(
    `
      INSERT INTO business (
        name,
        address_text,
        category_id,
        route_id,
        territory_id,
        status,
        priority,
        created_at,
        created_by,
        updated_at,
        updated_by,
        latitude,
        longitude
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING
        business_id,
        name,
        address_text,
        category_id,
        route_id,
        territory_id,
        status,
        priority,
        created_at,
        created_by,
        updated_at,
        updated_by,
        last_queried_at,
        latitude,
        longitude
    `,
    [
      String(payload.name).trim(),
      String(payload.addressText || '').trim(),
      toFiniteNumber(payload.categoryId),
      toFiniteNumber(payload.routeId),
      toFiniteNumber(payload.territoryId),
      String(payload.status || 'active').trim().toLowerCase(),
      toFiniteNumber(payload.priority),
      now,
      Number(actorUserId),
      now,
      Number(actorUserId),
      Number(payload.latitude),
      Number(payload.longitude),
    ]
  );

  return mapBusinessRow(result.rows[0]);
};

// Update mutable business fields.
const updateBusiness = async (businessId, updates, actorUserId) => {
  const assignments = [];
  const params = [];

  const add = (column, value) => {
    params.push(value);
    assignments.push(`${column} = $${params.length}`);
  };

  if (updates.name !== undefined) {
    add('name', String(updates.name).trim());
  }

  if (updates.addressText !== undefined) {
    add('address_text', String(updates.addressText).trim());
  }

  if (updates.categoryId !== undefined) {
    add('category_id', toFiniteNumber(updates.categoryId));
  }

  if (updates.routeId !== undefined) {
    add('route_id', toFiniteNumber(updates.routeId));
  }

  if (updates.territoryId !== undefined) {
    add('territory_id', toFiniteNumber(updates.territoryId));
  }

  if (updates.status !== undefined) {
    add('status', String(updates.status).trim().toLowerCase());
  }

  if (updates.priority !== undefined) {
    add('priority', toFiniteNumber(updates.priority));
  }

  if (updates.latitude !== undefined) {
    add('latitude', Number(updates.latitude));
  }

  if (updates.longitude !== undefined) {
    add('longitude', Number(updates.longitude));
  }

  add('updated_at', new Date().toISOString());
  add('updated_by', Number(actorUserId));

  params.push(Number(businessId));

  const result = await db.query(
    `
      UPDATE business
      SET ${assignments.join(', ')}
      WHERE business_id = $${params.length}
      RETURNING
        business_id,
        name,
        address_text,
        category_id,
        route_id,
        territory_id,
        status,
        priority,
        created_at,
        created_by,
        updated_at,
        updated_by,
        last_queried_at,
        latitude,
        longitude
    `,
    params
  );

  return mapBusinessRow(result.rows[0]);
};

// Delete one business record.
const deleteBusiness = async (businessId) => {
  const result = await db.query('DELETE FROM business WHERE business_id = $1', [
    Number(businessId),
  ]);

  return result.rowCount > 0;
};

// Export postgres repository methods.
module.exports = {
  listBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};
