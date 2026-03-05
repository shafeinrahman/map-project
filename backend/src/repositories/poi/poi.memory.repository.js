// In-memory POI storage for early development before DB wiring.
const poiStore = new Map();

// Incremental POI identifier seed.
let nextPoiId = 1;

// Convert mixed input into a finite number when possible.
const toFiniteNumber = (value) => {
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

// Convert incoming values into a normalized POI record.
const buildPoiRecord = ({ poiType, poiName, createdBy, latitude, longitude }) => {
  const now = new Date().toISOString();

  return {
    poiId: nextPoiId++,
    poiType: String(poiType).trim(),
    poiName: String(poiName).trim(),
    createdBy: toFiniteNumber(createdBy),
    latitude: toFiniteNumber(latitude),
    longitude: toFiniteNumber(longitude),
    createdAt: now,
    updatedAt: now,
    lastQueriedAt: null,
  };
};

// Check whether a POI matches filter parameters.
const matchesFilters = (poi, filters) => {
  const {
    poiType,
    createdBy,
    minLat,
    maxLat,
    minLng,
    maxLng,
  } = filters;

  if (poiType && poi.poiType !== poiType) {
    return false;
  }

  if (createdBy != null && poi.createdBy !== createdBy) {
    return false;
  }

  if (minLat != null && poi.latitude < minLat) {
    return false;
  }

  if (maxLat != null && poi.latitude > maxLat) {
    return false;
  }

  if (minLng != null && poi.longitude < minLng) {
    return false;
  }

  if (maxLng != null && poi.longitude > maxLng) {
    return false;
  }

  return true;
};

// Return paginated POIs that match optional filters.
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
  const normalizedFilters = {
    poiType: poiType ? String(poiType).trim() : null,
    createdBy: createdBy == null ? null : toFiniteNumber(createdBy),
    minLat: minLat == null ? null : toFiniteNumber(minLat),
    maxLat: maxLat == null ? null : toFiniteNumber(maxLat),
    minLng: minLng == null ? null : toFiniteNumber(minLng),
    maxLng: maxLng == null ? null : toFiniteNumber(maxLng),
  };

  const sanitizedLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const sanitizedOffset = Math.max(0, Number(offset) || 0);

  const all = Array.from(poiStore.values()).filter((poi) =>
    matchesFilters(poi, normalizedFilters)
  );

  const items = all.slice(sanitizedOffset, sanitizedOffset + sanitizedLimit);

  return {
    items,
    pagination: {
      total: all.length,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    },
  };
};

// Return map-oriented POIs with zoom-aware clustering.
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

  const normalizedFilters = {
    poiType: poiType ? String(poiType).trim() : null,
    createdBy: createdBy == null ? null : toFiniteNumber(createdBy),
    minLat: minLat == null ? null : toFiniteNumber(minLat),
    maxLat: maxLat == null ? null : toFiniteNumber(maxLat),
    minLng: minLng == null ? null : toFiniteNumber(minLng),
    maxLng: maxLng == null ? null : toFiniteNumber(maxLng),
  };

  const filtered = Array.from(poiStore.values()).filter(
    (poi) =>
      Number.isFinite(poi.latitude) &&
      Number.isFinite(poi.longitude) &&
      matchesFilters(poi, normalizedFilters)
  );

  if (zoomBand.mode === 'raw') {
    const items = filtered
      .sort((left, right) => left.poiId - right.poiId)
      .slice(sanitizedOffset, sanitizedOffset + sanitizedLimit)
      .map((poi) => ({
        poiId: poi.poiId,
        poiType: poi.poiType,
        poiName: poi.poiName,
        createdBy: poi.createdBy,
        createdAt: poi.createdAt,
        updatedAt: poi.updatedAt,
        lastQueriedAt: poi.lastQueriedAt,
        latitude: poi.latitude,
        longitude: poi.longitude,
      }));

    return {
      items,
      pagination: {
        total: filtered.length,
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

  const grouped = new Map();

  for (const poi of filtered) {
    const latBucket = Math.floor(poi.latitude / zoomBand.cellSize);
    const lngBucket = Math.floor(poi.longitude / zoomBand.cellSize);
    const key = `${latBucket}:${lngBucket}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        latitude: latBucket * zoomBand.cellSize + zoomBand.cellSize / 2,
        longitude: lngBucket * zoomBand.cellSize + zoomBand.cellSize / 2,
        clusterCount: 0,
        samplePoiId: poi.poiId,
        samplePoiName: poi.poiName,
        samplePoiType: poi.poiType,
        sampleCreatedBy: poi.createdBy,
        sampleCreatedAt: poi.createdAt,
        lastUpdatedAt: poi.updatedAt,
      });
    }

    const entry = grouped.get(key);
    entry.clusterCount += 1;

    if (poi.updatedAt && (!entry.lastUpdatedAt || poi.updatedAt > entry.lastUpdatedAt)) {
      entry.lastUpdatedAt = poi.updatedAt;
    }
  }

  const clusters = Array.from(grouped.values())
    .sort((left, right) => {
      if (right.clusterCount !== left.clusterCount) {
        return right.clusterCount - left.clusterCount;
      }

      if (left.latitude !== right.latitude) {
        return left.latitude - right.latitude;
      }

      return left.longitude - right.longitude;
    })
    .slice(sanitizedOffset, sanitizedOffset + sanitizedLimit)
    .map((entry) => ({
      poiId: entry.samplePoiId,
      poiType: entry.samplePoiType,
      poiName: entry.samplePoiName,
      createdBy: entry.sampleCreatedBy,
      createdAt: entry.sampleCreatedAt,
      updatedAt: entry.lastUpdatedAt,
      lastQueriedAt: entry.lastUpdatedAt,
      latitude: entry.latitude,
      longitude: entry.longitude,
      clusterCount: entry.clusterCount,
    }));

  return {
    items: clusters,
    pagination: {
      total: grouped.size,
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
  const numericPoiId = Number(poiId);
  return poiStore.get(numericPoiId) || null;
};

// Create and persist one POI.
const createPoi = async (payload, actorUserId) => {
  const record = buildPoiRecord({
    ...payload,
    createdBy: actorUserId,
  });

  poiStore.set(record.poiId, record);
  return record;
};

// Update mutable POI fields.
const updatePoi = async (poiId, updates) => {
  const current = await getPoiById(poiId);

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...(updates.poiType !== undefined && { poiType: String(updates.poiType).trim() }),
    ...(updates.poiName !== undefined && { poiName: String(updates.poiName).trim() }),
    ...(updates.latitude !== undefined && { latitude: toFiniteNumber(updates.latitude) }),
    ...(updates.longitude !== undefined && { longitude: toFiniteNumber(updates.longitude) }),
    updatedAt: new Date().toISOString(),
  };

  poiStore.set(next.poiId, next);
  return next;
};

// Remove one POI by identifier.
const deletePoi = async (poiId) => {
  const numericPoiId = Number(poiId);
  return poiStore.delete(numericPoiId);
};

// Export memory repository methods.
module.exports = {
  listPois,
  listPoisForMap,
  getPoiById,
  createPoi,
  updatePoi,
  deletePoi,
};
