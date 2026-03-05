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

const MAP_ZOOM_BANDS = [
  { minZoom: 0, maxZoom: 5, mode: 'cluster', label: 'very_coarse', cellSize: 1.2, defaultLimit: 6000 },
  { minZoom: 6, maxZoom: 10, mode: 'cluster', label: 'coarse_medium', cellSize: 0.4, defaultLimit: 7000 },
  { minZoom: 11, maxZoom: 15, mode: 'cluster', label: 'fine', cellSize: 0.1, defaultLimit: 9000 },
  { minZoom: 16, maxZoom: 18, mode: 'raw', label: 'raw_points', cellSize: null, defaultLimit: 5000 },
];

const getMapZoomBand = (zoom) => {
  const normalizedZoom = Number.isFinite(Number(zoom)) ? Number(zoom) : 0;

  return (
    MAP_ZOOM_BANDS.find(
      (band) => normalizedZoom >= band.minZoom && normalizedZoom <= band.maxZoom
    ) || MAP_ZOOM_BANDS[0]
  );
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

const withCoordinateClause = (whereClause) => {
  if (!whereClause) {
    return 'WHERE latitude IS NOT NULL AND longitude IS NOT NULL';
  }

  return `${whereClause} AND latitude IS NOT NULL AND longitude IS NOT NULL`;
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

// Return map-oriented business data with zoom-aware clustering.
const listBusinessesForMap = async ({
  status,
  categoryId,
  routeId,
  territoryId,
  minLat,
  maxLat,
  minLng,
  maxLng,
  zoom = 0,
  limit,
  offset = 0,
} = {}) => {
  const zoomBand = getMapZoomBand(zoom);
  const requestedLimit = Number(limit);
  const requestedOffset = Number(offset);

  const sanitizedLimit = Math.max(
    1,
    Math.min(
      zoomBand.defaultLimit,
      Number.isFinite(requestedLimit) ? Math.trunc(requestedLimit) : zoomBand.defaultLimit
    )
  );
  const sanitizedOffset = Math.max(0, Number.isFinite(requestedOffset) ? Math.trunc(requestedOffset) : 0);

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

  const mapWhereClause = withCoordinateClause(whereClause);

  if (zoomBand.mode === 'raw') {
    const totalResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM business ${mapWhereClause}`,
      params
    );

    const listParams = [...params, sanitizedLimit, sanitizedOffset];
    const listResult = await db.query(
      `
        SELECT
          business_id,
          name,
          status,
          updated_at,
          latitude,
          longitude
        FROM business
        ${mapWhereClause}
        ORDER BY business_id ASC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `,
      listParams
    );

    return {
      items: listResult.rows.map((row) => ({
        businessId: Number(row.business_id),
        name: row.name,
        status: row.status,
        updatedAt: row.updated_at,
        latitude: toFiniteNumber(row.latitude),
        longitude: toFiniteNumber(row.longitude),
      })),
      pagination: {
        total: totalResult.rows[0]?.total || 0,
        limit: sanitizedLimit,
        offset: sanitizedOffset,
      },
      mapMeta: {
        zoom: Number(zoom),
        aggregation: zoomBand.label,
        cellSize: null,
      },
    };
  }

  const cellSizeParamIndex = params.length + 1;
  const groupedCountResult = await db.query(
    `
      SELECT COUNT(*)::int AS total
      FROM (
        SELECT
          FLOOR(latitude / $${cellSizeParamIndex}),
          FLOOR(longitude / $${cellSizeParamIndex})
        FROM business
        ${mapWhereClause}
        GROUP BY 1, 2
      ) grouped
    `,
    [...params, zoomBand.cellSize]
  );

  const listParams = [...params, zoomBand.cellSize, sanitizedLimit, sanitizedOffset];
  const listResult = await db.query(
    `
      WITH filtered AS (
        SELECT
          business_id,
          name,
          status,
          updated_at,
          latitude,
          longitude
        FROM business
        ${mapWhereClause}
      ),
      clustered AS (
        SELECT
          AVG(latitude) AS cluster_lat,
          AVG(longitude) AS cluster_lng,
          COUNT(*)::int AS cluster_count,
          MIN(business_id) AS sample_business_id,
          MAX(updated_at) AS last_updated_at
        FROM filtered
        GROUP BY FLOOR(latitude / $${params.length + 1}), FLOOR(longitude / $${params.length + 1})
      )
      SELECT
        COALESCE(b.longitude, c.cluster_lng) AS longitude,
        COALESCE(b.latitude, c.cluster_lat) AS latitude,
        c.cluster_count,
        c.last_updated_at,
        b.business_id,
        b.name,
        b.status
      FROM clustered c
      LEFT JOIN business b ON b.business_id = c.sample_business_id
      ORDER BY c.cluster_count DESC, c.cluster_lat ASC, c.cluster_lng ASC
      LIMIT $${params.length + 2}
      OFFSET $${params.length + 3}
    `,
    listParams
  );

  return {
    items: listResult.rows.map((row) => ({
      businessId: Number(row.business_id),
      name: row.name,
      status: row.status,
      updatedAt: row.last_updated_at,
      latitude: toFiniteNumber(row.latitude),
      longitude: toFiniteNumber(row.longitude),
      clusterCount: Number(row.cluster_count),
    })),
    pagination: {
      total: groupedCountResult.rows[0]?.total || 0,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    },
    mapMeta: {
      zoom: Number(zoom),
      aggregation: zoomBand.label,
      cellSize: zoomBand.cellSize,
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
  listBusinessesForMap,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};
