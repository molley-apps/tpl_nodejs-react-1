import { Joi } from 'celebrate';

export default {
  setupAdminPost: {
    body: Joi.object({ key: Joi.string().min(16).max(200).required() }),
  },
};
