import { Joi } from 'celebrate';

export default {
  adminSchedulesNamePut: {
    body: Joi.object({
      cron: Joi.string().max(100).required(),
      timezone: Joi.string().max(64).required(),
      enabled: Joi.boolean().required(),
    }),
    params: Joi.object({
      name: Joi.string()
        .regex(/^[a-z][a-z0-9-]{2,40}$/)
        .required(),
    }),
  },

  adminSchedulesNameRunPost: {
    params: Joi.object({
      name: Joi.string()
        .regex(/^[a-z][a-z0-9-]{2,40}$/)
        .required(),
    }),
  },
};
