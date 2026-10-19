import express from 'express';

import { celebrate } from 'celebrate';

import permissionMiddleware from '../middleware/permissionMiddleware';

import setupValidators from '../validators/setupValidators';
import SetupDomain from '../../../domains/SetupDomain';
import setupTransformOutputs from '../transformOutputs/setupTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
       * Operation ID: setupAdminPost
       * Summary: Create a admin, from setup
       * Description: Grants SUPER_ADMIN to the signed-in user when the key matches the environment's setup key and no administrator
exists yet. Refused with 409 once there is one and 403 for a wrong key, so the key is useless after the claim.
       */

  router.post(
    '/admin' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiSetupAdminCreate'),
    /* Validate the request data and return validation errors */
    celebrate(setupValidators.setupAdminPost),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await SetupDomain.setupAdminPost(req.body, req),
        200,
        'application/json',
        setupTransformOutputs.setupAdminPost
      );
    }
  );

  return router;
}
