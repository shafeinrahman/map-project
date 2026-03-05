// Import business service logic.
const businessService = require('../services/business.service');

// Build a consistent HTTP error object.
const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Validate coordinate ranges when provided.
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

// Validate required business fields for creation.
const validateCreatePayload = (payload) => {
  const { name, latitude, longitude } = payload;

  if (!name || String(name).trim().length === 0) {
    throw createHttpError(400, 'name is required.');
  }

  if (latitude === undefined || longitude === undefined) {
    throw createHttpError(400, 'latitude and longitude are required.');
  }

  validateCoordinates({ latitude, longitude });
};

// Validate update payload shape.
const validateUpdatePayload = (payload) => {
  if (!payload || Object.keys(payload).length === 0) {
    throw createHttpError(400, 'At least one field is required for update.');
  }

  validateCoordinates(payload);
};

// GET /api/businesses
const listBusinesses = async (req, res) => {
  const result = await businessService.listBusinesses(req.query);
  return res.status(200).json(result);
};

// GET /api/businesses/geojson
const listBusinessesGeoJson = async (req, res) => {
  const result = await businessService.listBusinessesForMap(req.query);
  const featureCollection = businessService.toGeoJson(result.items);

  return res.status(200).json({
    ...featureCollection,
    pagination: result.pagination,
    mapMeta: result.mapMeta,
  });
};

// GET /api/businesses/:businessId
const getBusinessById = async (req, res, next) => {
  const business = await businessService.getBusinessById(req.params.businessId);

  if (!business) {
    return next(createHttpError(404, 'Business not found.'));
  }

  return res.status(200).json(business);
};

// POST /api/businesses
const createBusiness = async (req, res, next) => {
  try {
    validateCreatePayload(req.body);
    const created = await businessService.createBusiness(req.body, req.auth.userId);
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/businesses/:businessId
const updateBusiness = async (req, res, next) => {
  try {
    validateUpdatePayload(req.body);

    const updated = await businessService.updateBusiness(
      req.params.businessId,
      req.body,
      req.auth.userId
    );

    if (!updated) {
      return next(createHttpError(404, 'Business not found.'));
    }

    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/businesses/:businessId
const deleteBusiness = async (req, res, next) => {
  const deleted = await businessService.deleteBusiness(req.params.businessId);

  if (!deleted) {
    return next(createHttpError(404, 'Business not found.'));
  }

  return res.status(204).send();
};

// Export business controller handlers.
module.exports = {
  listBusinesses,
  listBusinessesGeoJson,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};
