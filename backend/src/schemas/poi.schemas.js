const { z } = require('zod');

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

const poiIdParamsSchema = z.object({
  poiId: z.string().regex(/^\d+$/),
});

const poiListQuerySchema = z.object({
  poiType: z.string().trim().optional(),
  createdBy: z.coerce.number().int().positive().optional(),
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLng: z.coerce.number().min(-180).max(180).optional(),
  maxLng: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const poiCreateBodySchema = z.object({
  poiType: z.string().trim().min(1),
  poiName: z.string().trim().min(1),
  latitude,
  longitude,
});

const poiUpdateBodySchema = z
  .object({
    poiType: z.string().trim().min(1).optional(),
    poiName: z.string().trim().min(1).optional(),
    latitude: latitude.optional(),
    longitude: longitude.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required.',
  });

module.exports = {
  poiIdParamsSchema,
  poiListQuerySchema,
  poiCreateBodySchema,
  poiUpdateBodySchema,
};
