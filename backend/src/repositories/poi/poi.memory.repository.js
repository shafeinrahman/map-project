// In-memory POI storage for early development before DB wiring.
const poiStore = new Map();

// Incremental POI identifier seed.
let nextPoiId = 1;

// Convert mixed input into a finite number when possible.
const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
  getPoiById,
  createPoi,
  updatePoi,
  deletePoi,
};
