// Import POI business logic.
const poiService = require('../services/poi.service');

// Create an error object with HTTP status metadata.
const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Validate latitude/longitude ranges when values are provided.
const validateCoordinates = ({ latitude, longitude }) => {
  if (latitude !== undefined) {
    const numericLatitude = Number(latitude);

    if (!Number.isFinite(numericLatitude) || numericLatitude < -90 || numericLatitude > 90) {
      throw createHttpError(400, 'latitude must be a number between -90 and 90.');
    }
  }

  if (longitude !== undefined) {
    const numericLongitude = Number(longitude);

    if (!Number.isFinite(numericLongitude) || numericLongitude < -180 || numericLongitude > 180) {
      throw createHttpError(400, 'longitude must be a number between -180 and 180.');
    }
  }
};

// Ensure required POI fields are present for creation.
const validateCreatePayload = (payload) => {
  const { poiType, poiName, latitude, longitude } = payload;

  if (!poiType || String(poiType).trim().length === 0) {
    throw createHttpError(400, 'poiType is required.');
  }

  if (!poiName || String(poiName).trim().length === 0) {
    throw createHttpError(400, 'poiName is required.');
  }

  if (latitude === undefined || longitude === undefined) {
    throw createHttpError(400, 'latitude and longitude are required.');
  }

  validateCoordinates({ latitude, longitude });
};

// Ensure update body is not empty and contains valid coordinate values.
const validateUpdatePayload = (payload) => {
  if (!payload || Object.keys(payload).length === 0) {
    throw createHttpError(400, 'At least one field is required for update.');
  }

  validateCoordinates(payload);
};

// GET /api/pois
const listPois = async (req, res) => {
  const result = await poiService.listPois(req.query);
  res.status(200).json(result);
};

// GET /api/pois/geojson
const listPoisGeoJson = async (req, res) => {
  const result = await poiService.listPoisForMap(req.query);
  const featureCollection = poiService.toGeoJson(result.items);

  res.status(200).json({
    ...featureCollection,
    pagination: result.pagination,
    mapMeta: result.mapMeta,
  });
};

// GET /api/pois/:poiId
const getPoiById = async (req, res, next) => {
  const poi = await poiService.getPoiById(req.params.poiId);

  if (!poi) {
    return next(createHttpError(404, 'POI not found.'));
  }

  return res.status(200).json(poi);
};

// POST /api/pois
const createPoi = async (req, res, next) => {
  try {
    validateCreatePayload(req.body);
    const created = await poiService.createPoi(req.body, req.auth.userId);
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/pois/:poiId
const updatePoi = async (req, res, next) => {
  try {
    validateUpdatePayload(req.body);

    const updated = await poiService.updatePoi(req.params.poiId, req.body);

    if (!updated) {
      return next(createHttpError(404, 'POI not found.'));
    }

    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/pois/:poiId
const deletePoi = async (req, res, next) => {
  const deleted = await poiService.deletePoi(req.params.poiId);

  if (!deleted) {
    return next(createHttpError(404, 'POI not found.'));
  }

  return res.status(204).send();
};

// Export controller handlers for POI routes.
module.exports = {
  listPois,
  listPoisGeoJson,
  getPoiById,
  createPoi,
  updatePoi,
  deletePoi,
};
