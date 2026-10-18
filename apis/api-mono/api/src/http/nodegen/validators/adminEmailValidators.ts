import { Joi } from 'celebrate';

export default {
  adminSettingsEmailDelete: {},

  adminSettingsEmailGet: {},

  adminSettingsEmailPut: {
    body: Joi.object({
      provider: Joi.string()
        .valid('resend', 'brevo', 'sendgrid', 'mailgun', 'smtp')
        .required(),
      host: Joi.string().max(255).required(),
      port: Joi.number().integer().min(1).max(65535).required(),
      secure: Joi.boolean().allow(null),
      username: Joi.string().max(255).required(),
      fromAddress: Joi.string().required(),
      fromName: Joi.string().allow('').max(100).allow(null),
      replyTo: Joi.string().allow('').allow(null),
      password: Joi.string().allow('').max(1024).allow(null),
    }),
  },

  adminSettingsEmailTestPost: {},
};
