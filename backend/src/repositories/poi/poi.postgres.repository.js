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
  { minZoom: 0, maxZoom: 4, mode: 'cluster', label: 'very_coarse', cellSize: 1.2, defaultLimit: 6000 },
  { minZoom: 5, maxZoom: 9, mode: 'cluster', label: 'coarse_medium', cellSize: 0.4, defaultLimit: 7000 },
  { minZoom: 10, maxZoom: 14, mode: 'cluster', label: 'fine', cellSize: 0.1, defaultLimit: 9000 },
  { minZoom: 15, maxZoom: 15, mode: 'cluster', label: 'fine_plus', cellSize: 0.03, defaultLimit: 12000 },
  { minZoom: 16, maxZoom: 22, mode: 'raw', label: 'raw_points', cellSize: null, defaultLimit: 5000 },
];

const getMapZoomBand = (zoom) => {
  const normalizedZoom = Number.isFinite(Number(zoom)) ? Number(zoom) : 0;

  return (
    MAP_ZOOM_BANDS.find(
      (band) => normalizedZoom >= band.minZoom && normalizedZoom <= band.maxZoom
    ) || MAP_ZOOM_BANDS[0]
  );
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

const withCoordinateClause = (whereClause) => {
  if (!whereClause) {
    return 'WHERE latitude IS NOT NULL AND longitude IS NOT NULL';
  }

  return `${whereClause} AND latitude IS NOT NULL AND longitude IS NOT NULL`;
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

// Return map-oriented POI data with zoom-aware clustering.
const listPoisForMap = async ({
  poiType,
  createdBy,
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
    poiType,
    createdBy,
    minLat,
    maxLat,
    minLng,
    maxLng,
  });

  const mapWhereClause = withCoordinateClause(whereClause);

  if (zoomBand.mode === 'raw') {
    const totalResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM point_of_interest ${mapWhereClause}`,
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
        ${mapWhereClause}
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
        FROM point_of_interest
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
          poi_id,
          poi_type,
          poi_name,
          created_at,
          created_by,
          last_queried_at,
          latitude,
          longitude
        FROM point_of_interest
        ${mapWhereClause}
      ),
      clustered AS (
        SELECT
          AVG(latitude) AS cluster_lat,
          AVG(longitude) AS cluster_lng,
          COUNT(*)::int AS cluster_count,
          MIN(poi_id) AS sample_poi_id,
          MAX(COALESCE(last_queried_at, created_at)) AS sample_updated_at
        FROM filtered
        GROUP BY FLOOR(latitude / $${params.length + 1}), FLOOR(longitude / $${params.length + 1})
      )
      SELECT
        COALESCE(p.longitude, c.cluster_lng) AS longitude,
        COALESCE(p.latitude, c.cluster_lat) AS latitude,
        c.cluster_count,
        c.sample_updated_at,
        p.poi_id,
        p.poi_type,
        p.poi_name,
        p.created_at,
        p.created_by
      FROM clustered c
      LEFT JOIN point_of_interest p ON p.poi_id = c.sample_poi_id
      ORDER BY c.cluster_count DESC, c.cluster_lat ASC, c.cluster_lng ASC
      LIMIT $${params.length + 2}
      OFFSET $${params.length + 3}
    `,
    listParams
  );

  return {
    items: listResult.rows.map((row) => ({
      poiId: Number(row.poi_id),
      poiType: row.poi_type,
      poiName: row.poi_name,
      createdBy: toFiniteNumber(row.created_by),
      createdAt: row.created_at,
      updatedAt: row.sample_updated_at || row.created_at,
      lastQueriedAt: row.sample_updated_at,
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
  listPoisForMap,
  getPoiById,
  createPoi,
  updatePoi,
  deletePoi,
};
