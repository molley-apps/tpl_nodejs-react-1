import express from 'express';

import { celebrate } from 'celebrate';

import permissionMiddleware from '../middleware/permissionMiddleware';

import internalNameValidators from '../validators/internalNameValidators';
import InternalNameDomain from '../../../domains/InternalNameDomain';
import internalNameTransformOutputs from '../transformOutputs/internalNameTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
       * Operation ID: internalJobsNamePost
       * Summary: Create a jobs based on {name}, from internal
       * Description: Called by Cloud Scheduler with an OIDC token for this environment's invoker service account; anything else is 401.
Runs the job once (a concurrent or retried call is skipped) and answers 200 even when the job itself failed, so
Scheduler does not retry an application failure.
       */

  router.post(
    '/jobs/:name' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiInternalJobsNameCreate'),
    /* Validate the request data and return validation errors */
    celebrate(internalNameValidators.internalJobsNamePost),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await InternalNameDomain.internalJobsNamePost(req.params, req),
        200,
        'application/json',
        internalNameTransformOutputs.internalJobsNamePost
      );
    }
  );

  return router;
}
