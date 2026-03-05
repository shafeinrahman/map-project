// Import selected POI repository implementation.
const poiRepository = require('../repositories/poi');

// Return paginated POIs that match optional filters.
const listPois = async (filters = {}) => poiRepository.listPois(filters);

// Return map-oriented POIs with zoom-aware aggregation.
const listPoisForMap = async (filters = {}) => poiRepository.listPoisForMap(filters);

// Return one POI by identifier.
const getPoiById = async (poiId) => poiRepository.getPoiById(poiId);

// Create and persist one POI.
const createPoi = async (payload, actorUserId) => poiRepository.createPoi(payload, actorUserId);

// Update mutable POI fields.
const updatePoi = async (poiId, updates) => poiRepository.updatePoi(poiId, updates);

// Remove one POI by identifier.
const deletePoi = async (poiId) => poiRepository.deletePoi(poiId);

// Build a GeoJSON FeatureCollection for map rendering.
const toGeoJson = (pois) => {
  return {
    type: 'FeatureCollection',
    features: pois.map((poi) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [poi.longitude, poi.latitude],
      },
      properties: {
        isCluster: Number(poi.clusterCount) > 1,
        clusterCount: Number(poi.clusterCount) > 1 ? Number(poi.clusterCount) : undefined,
        poiId: poi.poiId,
        poiType: poi.poiType,
        poiName: poi.poiName,
        createdBy: poi.createdBy,
        createdAt: poi.createdAt,
        updatedAt: poi.updatedAt,
      },
    })),
  };
};

// Export POI service operations.
module.exports = {
  listPois,
  listPoisForMap,
  getPoiById,
  createPoi,
  updatePoi,
  deletePoi,
  toGeoJson,
};
