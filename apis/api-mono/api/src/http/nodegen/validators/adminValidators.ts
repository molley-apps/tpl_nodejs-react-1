import { Joi } from 'celebrate';

export default {
  adminSchedulesGet: {},

  adminUsersGet: {
    query: Joi.object({
      offset: Joi.number().integer().min(0),
      limit: Joi.number().integer().default(25).min(0).max(100),
      search: Joi.string().allow(''),
      role: Joi.string().allow(''),
    }),
  },
};
