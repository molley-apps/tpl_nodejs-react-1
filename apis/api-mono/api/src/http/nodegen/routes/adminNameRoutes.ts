import express from 'express';

import { celebrate } from 'celebrate';

import permissionMiddleware from '../middleware/permissionMiddleware';

import adminNameValidators from '../validators/adminNameValidators';
import AdminNameDomain from '../../../domains/AdminNameDomain';
import adminNameTransformOutputs from '../transformOutputs/adminNameTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
       * Operation ID: adminSchedulesNamePut
       * Summary: Update a schedules based on {name}, from admin
       * Description: Saves the cron expression, timezone and enabled flag. Enabling creates the Cloud Scheduler job in this environment,
disabling deletes it. Nothing runs while a job is disabled.
       */

  router.put(
    '/schedules/:name' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSchedulesNameUpdate'),
    /* Validate the request data and return validation errors */
    celebrate(adminNameValidators.adminSchedulesNamePut),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminNameDomain.adminSchedulesNamePut(req.body, req.params, req),
        200,
        'application/json',
        adminNameTransformOutputs.adminSchedulesNamePut
      );
    }
  );

  /**
   * Operation ID: adminSchedulesNameRunPost
   * Summary: Create a run, from schedules {name}, from admin
   * Description: Executes the job immediately in this request, whether or not it is enabled, and returns the recorded run. Skipped when the job is already running.
   */

  router.post(
    '/schedules/:name/run' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSchedulesNameRunCreate'),
    /* Validate the request data and return validation errors */
    celebrate(adminNameValidators.adminSchedulesNameRunPost),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminNameDomain.adminSchedulesNameRunPost(req.params, req),
        200,
        'application/json',
        adminNameTransformOutputs.adminSchedulesNameRunPost
      );
    }
  );

  return router;
}
