// Build a consistent HTTP error object.
const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Require specific body fields to be present and non-empty.
const requireBodyFields = (fields) => {
  return (req, res, next) => {
    void res;

    for (const fieldName of fields) {
      const value = req.body?.[fieldName];

      if (value === undefined || value === null) {
        return next(createHttpError(400, `${fieldName} is required.`));
      }

      if (typeof value === 'string' && value.trim().length === 0) {
        return next(createHttpError(400, `${fieldName} is required.`));
      }
    }

    return next();
  };
};

// Validate route param as positive integer identifier.
const validatePositiveIdParam = (paramName) => {
  return (req, res, next) => {
    void res;

    const parsed = Number(req.params?.[paramName]);
    const isValid = Number.isInteger(parsed) && parsed > 0;

    if (!isValid) {
      return next(createHttpError(400, `${paramName} must be a positive integer.`));
    }

    return next();
  };
};

// Validate latitude and longitude values when provided.
const validateCoordinatesIfPresent = (req, res, next) => {
  void res;

  const { latitude, longitude } = req.body || {};

  if (latitude !== undefined) {
    const numericLatitude = Number(latitude);

    if (!Number.isFinite(numericLatitude) || numericLatitude < -90 || numericLatitude > 90) {
      return next(createHttpError(400, 'latitude must be a number between -90 and 90.'));
    }
  }

  if (longitude !== undefined) {
    const numericLongitude = Number(longitude);

    if (!Number.isFinite(numericLongitude) || numericLongitude < -180 || numericLongitude > 180) {
      return next(createHttpError(400, 'longitude must be a number between -180 and 180.'));
    }
  }

  return next();
};

// Ensure PATCH body is present and includes at least one field.
const requireNonEmptyBody = (req, res, next) => {
  void res;

  if (!req.body || Object.keys(req.body).length === 0) {
    return next(createHttpError(400, 'Request body must include at least one field.'));
  }

  return next();
};

// Export validation middleware utilities.
module.exports = {
  requireBodyFields,
  validatePositiveIdParam,
  validateCoordinatesIfPresent,
  requireNonEmptyBody,
};
