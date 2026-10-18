import express from 'express';

import permissionMiddleware from '../middleware/permissionMiddleware';

import capabilitiesValidators from '../validators/capabilitiesValidators';
import CapabilitiesDomain from '../../../domains/CapabilitiesDomain';
import capabilitiesTransformOutputs from '../transformOutputs/capabilitiesTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
   * Operation ID: capabilitiesGet
   * Summary: Get capabilities
   * Description: Public. The users app reads it before showing flows that depend on them, eg password reset needs email.
   */

  router.get(
    '/' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiCapabilitiesRead'),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await CapabilitiesDomain.capabilitiesGet(req),
        200,
        'application/json',
        capabilitiesTransformOutputs.capabilitiesGet
      );
    }
  );

  return router;
}
