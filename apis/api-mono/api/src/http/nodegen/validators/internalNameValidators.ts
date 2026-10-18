import { Joi } from 'celebrate';

export default {
  internalJobsNamePost: {
    params: Joi.object({
      name: Joi.string()
        .regex(/^[a-z][a-z0-9-]{2,40}$/)
        .required(),
    }),
  },
};
