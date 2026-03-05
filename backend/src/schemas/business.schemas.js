const { z } = require('zod');

const positiveInteger = z.coerce.number().int().positive();
const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

const businessIdParamsSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
});

const businessListQuerySchema = z.object({
  status: z.string().trim().toLowerCase().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  routeId: z.coerce.number().int().positive().optional(),
  territoryId: z.coerce.number().int().positive().optional(),
  zoom: z.coerce.number().min(0).max(22).optional(),
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLng: z.coerce.number().min(-180).max(180).optional(),
  maxLng: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const businessCreateBodySchema = z.object({
  name: z.string().trim().min(1),
  addressText: z.string().trim().optional(),
  categoryId: positiveInteger.optional(),
  routeId: positiveInteger.optional(),
  territoryId: positiveInteger.optional(),
  status: z.string().trim().toLowerCase().optional(),
  priority: z.coerce.number().int().optional(),
  latitude,
  longitude,
});

const businessUpdateBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    addressText: z.string().trim().optional(),
    categoryId: positiveInteger.optional(),
    routeId: positiveInteger.optional(),
    territoryId: positiveInteger.optional(),
    status: z.string().trim().toLowerCase().optional(),
    priority: z.coerce.number().int().optional(),
    latitude: latitude.optional(),
    longitude: longitude.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required.',
  });

module.exports = {
  businessIdParamsSchema,
  businessListQuerySchema,
  businessCreateBodySchema,
  businessUpdateBodySchema,
};
