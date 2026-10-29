import express from 'express';

import { celebrate } from 'celebrate';

import permissionMiddleware from '../middleware/permissionMiddleware';

import adminValidators from '../validators/adminValidators';
import AdminDomain from '../../../domains/AdminDomain';
import adminTransformOutputs from '../transformOutputs/adminTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
   * Operation ID: adminSchedulesGet
   * Summary: Get schedules, from admin
   * Description: One row per job registered in the code (src/jobs), with the administrator-owned schedule, the last run and the next run.
   */

  router.get(
    '/schedules' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSchedulesRead'),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminDomain.adminSchedulesGet(req),
        200,
        'application/json',
        adminTransformOutputs.adminSchedulesGet
      );
    }
  );

  /**
       * Operation ID: adminSecretsGet
       * Summary: Get secrets, from admin
       * Description: Every secret the administrator has saved (API keys and tokens for outside services the app integrates with),
without their values: only the last four characters are ever returned.
       */

  router.get(
    '/secrets' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSecretsRead'),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminDomain.adminSecretsGet(req),
        200,
        'application/json',
        adminTransformOutputs.adminSecretsGet
      );
    }
  );

  /**
   * Operation ID: adminUsersGet
   * Summary: Get users, from admin
   * Description: Everyone with an account, newest first. Search matches email and name; role filters on a system role.
   */

  router.get(
    '/users' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminUsersRead'),
    /* Validate the request data and return validation errors */
    celebrate(adminValidators.adminUsersGet),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminDomain.adminUsersGet(req.query, req),
        200,
        'application/json',
        adminTransformOutputs.adminUsersGet
      );
    }
  );

  return router;
}
