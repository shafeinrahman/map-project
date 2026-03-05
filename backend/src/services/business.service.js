// Import selected business repository implementation.
const businessRepository = require('../repositories/business');

// Return filtered and paginated businesses.
const listBusinesses = async (filters = {}) => businessRepository.listBusinesses(filters);

// Return map-oriented businesses with zoom-aware aggregation.
const listBusinessesForMap = async (filters = {}) => businessRepository.listBusinessesForMap(filters);

// Find one business by identifier.
const getBusinessById = async (businessId) => businessRepository.getBusinessById(businessId);

// Create and persist one business.
const createBusiness = async (payload, actorUserId) =>
  businessRepository.createBusiness(payload, actorUserId);

// Update mutable business fields.
const updateBusiness = async (businessId, updates, actorUserId) =>
  businessRepository.updateBusiness(businessId, updates, actorUserId);

// Remove one business.
const deleteBusiness = async (businessId) => businessRepository.deleteBusiness(businessId);

// Convert businesses into GeoJSON for map rendering.
const toGeoJson = (businesses) => {
  return {
    type: 'FeatureCollection',
    features: businesses.map((business) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [business.longitude, business.latitude],
      },
      properties: {
        isCluster: Number(business.clusterCount) > 1,
        clusterCount: Number(business.clusterCount) > 1 ? Number(business.clusterCount) : undefined,
        businessId: business.businessId,
        name: business.name,
        status: business.status,
        categoryId: business.categoryId,
        territoryId: business.territoryId,
        routeId: business.routeId,
        priority: business.priority,
        updatedAt: business.updatedAt,
      },
    })),
  };
};

// Export Business service operations.
module.exports = {
  listBusinesses,
  listBusinessesForMap,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  toGeoJson,
};
