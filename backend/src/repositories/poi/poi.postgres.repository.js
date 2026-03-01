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

// Convert a DB row to API POI shape.
const mapPoiRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    poiId: Number(row.poi_id),
    poiType: row.poi_type,
    poiName: row.poi_name,
    createdBy: toFiniteNumber(row.created_by),
    createdAt: row.created_at,
    updatedAt: row.last_queried_at || row.created_at,
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

  if (filters.poiType) {
    add('poi_type =', String(filters.poiType).trim());
  }

  if (filters.createdBy != null) {
    add('created_by =', Number(filters.createdBy));
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

// Return filtered and paginated POIs.
const listPois = async ({
  poiType,
  createdBy,
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
    poiType,
    createdBy,
    minLat,
    maxLat,
    minLng,
    maxLng,
  });

  const totalResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM point_of_interest ${whereClause}`,
    params
  );

  const listParams = [...params, sanitizedLimit, sanitizedOffset];

  const listResult = await db.query(
    `
      SELECT
        poi_id,
        poi_type,
        poi_name,
        created_at,
        created_by,
        last_queried_at,
        latitude,
        longitude
      FROM point_of_interest
      ${whereClause}
      ORDER BY poi_id ASC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    listParams
  );

  return {
    items: listResult.rows.map(mapPoiRow),
    pagination: {
      total: totalResult.rows[0]?.total || 0,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    },
  };
};

// Return one POI by identifier.
const getPoiById = async (poiId) => {
  const result = await db.query(
    `
      SELECT
        poi_id,
        poi_type,
        poi_name,
        created_at,
        created_by,
        last_queried_at,
        latitude,
        longitude
      FROM point_of_interest
      WHERE poi_id = $1
    `,
    [Number(poiId)]
  );

  return mapPoiRow(result.rows[0]);
};

// Create and persist one POI.
const createPoi = async (payload, actorUserId) => {
  const now = new Date().toISOString();

  const result = await db.query(
    `
      INSERT INTO point_of_interest (
        poi_type,
        poi_name,
        created_at,
        created_by,
        latitude,
        longitude
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        poi_id,
        poi_type,
        poi_name,
        created_at,
        created_by,
        last_queried_at,
        latitude,
        longitude
    `,
    [
      String(payload.poiType).trim(),
      String(payload.poiName).trim(),
      now,
      Number(actorUserId),
      Number(payload.latitude),
      Number(payload.longitude),
    ]
  );

  return mapPoiRow(result.rows[0]);
};

// Update mutable POI fields.
const updatePoi = async (poiId, updates) => {
  const assignments = [];
  const params = [];

  const add = (column, value) => {
    params.push(value);
    assignments.push(`${column} = $${params.length}`);
  };

  if (updates.poiType !== undefined) {
    add('poi_type', String(updates.poiType).trim());
  }

  if (updates.poiName !== undefined) {
    add('poi_name', String(updates.poiName).trim());
  }

  if (updates.latitude !== undefined) {
    add('latitude', Number(updates.latitude));
  }

  if (updates.longitude !== undefined) {
    add('longitude', Number(updates.longitude));
  }

  if (assignments.length === 0) {
    return getPoiById(poiId);
  }

  params.push(Number(poiId));

  const result = await db.query(
    `
      UPDATE point_of_interest
      SET ${assignments.join(', ')}
      WHERE poi_id = $${params.length}
      RETURNING
        poi_id,
        poi_type,
        poi_name,
        created_at,
        created_by,
        last_queried_at,
        latitude,
        longitude
    `,
    params
  );

  return mapPoiRow(result.rows[0]);
};

// Remove one POI record.
const deletePoi = async (poiId) => {
  const result = await db.query('DELETE FROM point_of_interest WHERE poi_id = $1', [
    Number(poiId),
  ]);

  return result.rowCount > 0;
};

// Export postgres repository methods.
module.exports = {
  listPois,
  getPoiById,
  createPoi,
  updatePoi,
  deletePoi,
};
