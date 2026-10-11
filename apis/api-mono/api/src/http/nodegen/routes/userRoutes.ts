import express from 'express';

import { celebrate } from 'celebrate';

import permissionMiddleware from '../middleware/permissionMiddleware';

import userValidators from '../validators/userValidators';
import UserDomain from '../../../domains/UserDomain';
import userTransformOutputs from '../transformOutputs/userTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
   * Operation ID: userCurrentGet
   * Summary: Get current, from user
   *
   */

  router.get(
    '/current' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiUserCurrentRead'),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await UserDomain.userCurrentGet(req),
        200,
        'application/json',
        userTransformOutputs.userCurrentGet
      );
    }
  );

  /**
   * Operation ID: userCurrentPut
   * Summary: Update a current, from user
   *
   */

  router.put(
    '/current' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiUserCurrentUpdate'),
    /* Validate the request data and return validation errors */
    celebrate(userValidators.userCurrentPut),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await UserDomain.userCurrentPut(req.body, req),
        200,
        'application/json',
        userTransformOutputs.userCurrentPut
      );
    }
  );

  return router;
}
