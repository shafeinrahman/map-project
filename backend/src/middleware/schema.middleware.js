// Validate request segments with zod schemas and return normalized values.
const validateSchema = (segment, schema) => {
  return (req, res, next) => {
    void res;

    const parsed = schema.safeParse(req[segment]);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const path = firstIssue?.path?.join('.') || segment;
      const error = new Error(`${path}: ${firstIssue?.message || 'Invalid request data.'}`);
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    req[segment] = parsed.data;
    return next();
  };
};

const validateBody = (schema) => validateSchema('body', schema);
const validateParams = (schema) => validateSchema('params', schema);
const validateQuery = (schema) => validateSchema('query', schema);

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
};
