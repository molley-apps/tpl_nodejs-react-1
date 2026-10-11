import express from 'express';

import healthValidators from '../validators/healthValidators';
import HealthDomain from '../../../domains/HealthDomain';
import healthTransformOutputs from '../transformOutputs/healthTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
   * Operation ID: healthGet
   * Summary: Get health
   *
   */

  router.get(
    '/' /* x-raw-body on path not found: Format the body */,
    express.json({ limit: '50mb' }),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await HealthDomain.healthGet(),
        200,
        'application/json',
        healthTransformOutputs.healthGet
      );
    }
  );

  return router;
}
