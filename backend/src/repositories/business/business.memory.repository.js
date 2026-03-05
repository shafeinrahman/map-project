// In-memory Business storage for iterative backend development.
const businessStore = new Map();

// Incrementing identifier seed for created businesses.
let nextBusinessId = 1;

// Convert incoming values to finite numbers when valid.
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

// Build one normalized business record from input payload.
const buildBusinessRecord = ({
  name,
  addressText,
  categoryId,
  routeId,
  territoryId,
  status,
  priority,
  latitude,
  longitude,
  actorUserId,
}) => {
  const now = new Date().toISOString();

  return {
    businessId: nextBusinessId++,
    name: String(name).trim(),
    addressText: String(addressText || '').trim(),
    categoryId: toFiniteNumber(categoryId),
    routeId: toFiniteNumber(routeId),
    territoryId: toFiniteNumber(territoryId),
    status: String(status || 'active').trim().toLowerCase(),
    priority: toFiniteNumber(priority),
    latitude: toFiniteNumber(latitude),
    longitude: toFiniteNumber(longitude),
    createdAt: now,
    createdBy: toFiniteNumber(actorUserId),
    updatedAt: now,
    updatedBy: toFiniteNumber(actorUserId),
    lastQueriedAt: null,
  };
};

// Check whether one business matches current filter input.
const matchesFilters = (business, filters) => {
  const {
    status,
    categoryId,
    routeId,
    territoryId,
    minLat,
    maxLat,
    minLng,
    maxLng,
  } = filters;

  if (status && business.status !== status) {
    return false;
  }

  if (categoryId != null && business.categoryId !== categoryId) {
    return false;
  }

  if (routeId != null && business.routeId !== routeId) {
    return false;
  }

  if (territoryId != null && business.territoryId !== territoryId) {
    return false;
  }

  if (minLat != null && business.latitude < minLat) {
    return false;
  }

  if (maxLat != null && business.latitude > maxLat) {
    return false;
  }

  if (minLng != null && business.longitude < minLng) {
    return false;
  }

  if (maxLng != null && business.longitude > maxLng) {
    return false;
  }

  return true;
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
  const normalizedFilters = {
    status: status ? String(status).trim().toLowerCase() : null,
    categoryId: categoryId == null ? null : toFiniteNumber(categoryId),
    routeId: routeId == null ? null : toFiniteNumber(routeId),
    territoryId: territoryId == null ? null : toFiniteNumber(territoryId),
    minLat: minLat == null ? null : toFiniteNumber(minLat),
    maxLat: maxLat == null ? null : toFiniteNumber(maxLat),
    minLng: minLng == null ? null : toFiniteNumber(minLng),
    maxLng: maxLng == null ? null : toFiniteNumber(maxLng),
  };

  const sanitizedLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const sanitizedOffset = Math.max(0, Number(offset) || 0);

  const all = Array.from(businessStore.values()).filter((business) =>
    matchesFilters(business, normalizedFilters)
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

  const normalizedFilters = {
    status: status ? String(status).trim().toLowerCase() : null,
    categoryId: categoryId == null ? null : toFiniteNumber(categoryId),
    routeId: routeId == null ? null : toFiniteNumber(routeId),
    territoryId: territoryId == null ? null : toFiniteNumber(territoryId),
    minLat: minLat == null ? null : toFiniteNumber(minLat),
    maxLat: maxLat == null ? null : toFiniteNumber(maxLat),
    minLng: minLng == null ? null : toFiniteNumber(minLng),
    maxLng: maxLng == null ? null : toFiniteNumber(maxLng),
  };

  const filtered = Array.from(businessStore.values()).filter(
    (business) =>
      Number.isFinite(business.latitude) &&
      Number.isFinite(business.longitude) &&
      matchesFilters(business, normalizedFilters)
  );

  if (zoomBand.mode === 'raw') {
    const items = filtered
      .sort((left, right) => left.businessId - right.businessId)
      .slice(sanitizedOffset, sanitizedOffset + sanitizedLimit)
      .map((business) => ({
        businessId: business.businessId,
        name: business.name,
        status: business.status,
        updatedAt: business.updatedAt,
        latitude: business.latitude,
        longitude: business.longitude,
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

  for (const business of filtered) {
    const latBucket = Math.floor(business.latitude / zoomBand.cellSize);
    const lngBucket = Math.floor(business.longitude / zoomBand.cellSize);
    const key = `${latBucket}:${lngBucket}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        latitude: latBucket * zoomBand.cellSize + zoomBand.cellSize / 2,
        longitude: lngBucket * zoomBand.cellSize + zoomBand.cellSize / 2,
        clusterCount: 0,
        sampleBusinessId: business.businessId,
        sampleName: business.name,
        sampleStatus: business.status,
        lastUpdatedAt: business.updatedAt,
      });
    }

    const entry = grouped.get(key);
    entry.clusterCount += 1;

    if (business.updatedAt && (!entry.lastUpdatedAt || business.updatedAt > entry.lastUpdatedAt)) {
      entry.lastUpdatedAt = business.updatedAt;
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
      businessId: entry.sampleBusinessId,
      name: entry.sampleName,
      status: entry.sampleStatus,
      updatedAt: entry.lastUpdatedAt,
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

// Find one business by identifier.
const getBusinessById = async (businessId) => {
  const numericBusinessId = Number(businessId);
  return businessStore.get(numericBusinessId) || null;
};

// Create and persist one business.
const createBusiness = async (payload, actorUserId) => {
  const record = buildBusinessRecord({ ...payload, actorUserId });
  businessStore.set(record.businessId, record);
  return record;
};

// Update mutable business fields.
const updateBusiness = async (businessId, updates, actorUserId) => {
  const current = await getBusinessById(businessId);

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...(updates.name !== undefined && { name: String(updates.name).trim() }),
    ...(updates.addressText !== undefined && { addressText: String(updates.addressText).trim() }),
    ...(updates.categoryId !== undefined && { categoryId: toFiniteNumber(updates.categoryId) }),
    ...(updates.routeId !== undefined && { routeId: toFiniteNumber(updates.routeId) }),
    ...(updates.territoryId !== undefined && { territoryId: toFiniteNumber(updates.territoryId) }),
    ...(updates.status !== undefined && { status: String(updates.status).trim().toLowerCase() }),
    ...(updates.priority !== undefined && { priority: toFiniteNumber(updates.priority) }),
    ...(updates.latitude !== undefined && { latitude: toFiniteNumber(updates.latitude) }),
    ...(updates.longitude !== undefined && { longitude: toFiniteNumber(updates.longitude) }),
    updatedAt: new Date().toISOString(),
    updatedBy: toFiniteNumber(actorUserId),
  };

  businessStore.set(next.businessId, next);
  return next;
};

// Remove one business.
const deleteBusiness = async (businessId) => {
  const numericBusinessId = Number(businessId);
  return businessStore.delete(numericBusinessId);
};

// Export memory repository methods.
module.exports = {
  listBusinesses,
  listBusinessesForMap,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};
