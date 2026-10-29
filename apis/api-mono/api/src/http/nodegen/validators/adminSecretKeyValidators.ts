import { Joi } from 'celebrate';

export default {
  adminSecretsSecretKeyDelete: {
    params: Joi.object({
      secretKey: Joi.string()
        .regex(/^[A-Z][A-Z0-9_]{1,63}$/)
        .required(),
    }),
  },

  adminSecretsSecretKeyPut: {
    body: Joi.object({
      description: Joi.string().allow('').max(200).allow(null),
      value: Joi.string().allow('').max(4096).allow(null),
    }),
    params: Joi.object({
      secretKey: Joi.string()
        .regex(/^[A-Z][A-Z0-9_]{1,63}$/)
        .required(),
    }),
  },
};
