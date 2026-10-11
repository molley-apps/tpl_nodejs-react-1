import { Joi } from 'celebrate';

export default {
  userCurrentGet: {},

  userCurrentPut: {
    body: Joi.object({
      firstName: Joi.string().max(100).required(),
      lastName: Joi.string().max(100).required(),
      name: Joi.string().allow('').max(200).allow(null),
      image: Joi.string().allow('').max(2048).allow(null),
    }),
  },
};
