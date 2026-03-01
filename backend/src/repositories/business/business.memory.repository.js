// In-memory Business storage for iterative backend development.
const businessStore = new Map();

// Incrementing identifier seed for created businesses.
let nextBusinessId = 1;

// Convert incoming values to finite numbers when valid.
const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};
