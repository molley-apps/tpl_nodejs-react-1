import express from 'express';

import { celebrate } from 'celebrate';

import permissionMiddleware from '../middleware/permissionMiddleware';

import adminSecretKeyValidators from '../validators/adminSecretKeyValidators';
import AdminSecretKeyDomain from '../../../domains/AdminSecretKeyDomain';
import adminSecretKeyTransformOutputs from '../transformOutputs/adminSecretKeyTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
   * Operation ID: adminSecretsSecretKeyDelete
   * Summary: Delete a secrets based on {secretKey}, from admin
   * Description: Deletes the secret. Any feature that needs it reports it as not configured from the next request.
   */

  router.delete(
    '/secrets/:secretKey' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSecretsSecretKeyDelete'),
    /* Validate the request data and return validation errors */
    celebrate(adminSecretKeyValidators.adminSecretsSecretKeyDelete),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminSecretKeyDomain.adminSecretsSecretKeyDelete(req.params, req),
        200,
        'application/json',
        adminSecretKeyTransformOutputs.adminSecretsSecretKeyDelete
      );
    }
  );

  /**
       * Operation ID: adminSecretsSecretKeyPut
       * Summary: Update a secrets based on {secretKey}, from admin
       * Description: Stores the value encrypted under the given name. The code reads it with AppSecretsService.get(name) on each
use, so a new value applies at once, without a redeploy. Omit the value to change only the description.
       */

  router.put(
    '/secrets/:secretKey' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSecretsSecretKeyUpdate'),
    /* Validate the request data and return validation errors */
    celebrate(adminSecretKeyValidators.adminSecretsSecretKeyPut),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminSecretKeyDomain.adminSecretsSecretKeyPut(
          req.body,
          req.params,
          req
        ),
        200,
        'application/json',
        adminSecretKeyTransformOutputs.adminSecretsSecretKeyPut
      );
    }
  );

  return router;
}
