import { Joi } from 'celebrate';

export default {
  adminUsersUserIdDelete: {
    params: Joi.object({ userId: Joi.string().required() }),
  },

  adminUsersUserIdRolesPut: {
    body: Joi.object({
      roles: Joi.array()
        .items(Joi.string().allow('').valid('SUPER_ADMIN').allow(null))
        .required(),
    }),
    params: Joi.object({ userId: Joi.string().required() }),
  },

  adminUsersUserIdSessionsDelete: {
    params: Joi.object({ userId: Joi.string().required() }),
  },

  adminUsersUserIdSessionsGet: {
    params: Joi.object({ userId: Joi.string().required() }),
  },
};
