const { z } = require('zod');

const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

module.exports = {
  loginBodySchema,
};
