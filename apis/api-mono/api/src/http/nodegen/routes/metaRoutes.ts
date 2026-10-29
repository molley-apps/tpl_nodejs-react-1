import express from 'express';

import permissionMiddleware from '../middleware/permissionMiddleware';

import metaValidators from '../validators/metaValidators';
import MetaDomain from '../../../domains/MetaDomain';
import metaTransformOutputs from '../transformOutputs/metaTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
       * Operation ID: metaGet
       * Summary: Get meta
       * Description: What the users app needs before anyone is signed in: the app's name and the feature flags that decide which
options to show (eg password reset only when outgoing email works). Readable by anyone, so it carries flags
and labels only, never configuration values or secrets.
       */

  router.get(
    '/' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiMetaRead'),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await MetaDomain.metaGet(req),
        200,
        'application/json',
        metaTransformOutputs.metaGet
      );
    }
  );

  return router;
}
