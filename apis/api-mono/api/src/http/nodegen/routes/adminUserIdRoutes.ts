import express from 'express';

import { celebrate } from 'celebrate';

import permissionMiddleware from '../middleware/permissionMiddleware';

import adminUserIdValidators from '../validators/adminUserIdValidators';
import AdminUserIdDomain from '../../../domains/AdminUserIdDomain';
import adminUserIdTransformOutputs from '../transformOutputs/adminUserIdTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
   * Operation ID: adminUsersUserIdDelete
   * Summary: Delete a users based on {userId}, from admin
   * Description: Removes the account, its credentials and every session. A system admin cannot delete their own account.
   */

  router.delete(
    '/users/:userId' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminUsersUserIdDelete'),
    /* Validate the request data and return validation errors */
    celebrate(adminUserIdValidators.adminUsersUserIdDelete),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminUserIdDomain.adminUsersUserIdDelete(req.params, req),
        200,
        'application/json',
        adminUserIdTransformOutputs.adminUsersUserIdDelete
      );
    }
  );

  /**
   * Operation ID: adminUsersUserIdRolesPut
   * Summary: Update a roles, from users {userId}, from admin
   * Description: Replaces the user's system roles. A system admin cannot remove their own SUPER_ADMIN role.
   */

  router.put(
    '/users/:userId/roles' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminUsersUserIdRolesUpdate'),
    /* Validate the request data and return validation errors */
    celebrate(adminUserIdValidators.adminUsersUserIdRolesPut),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminUserIdDomain.adminUsersUserIdRolesPut(
          req.body,
          req.params,
          req
        ),
        200,
        'application/json',
        adminUserIdTransformOutputs.adminUsersUserIdRolesPut
      );
    }
  );

  /**
   * Operation ID: adminUsersUserIdSessionsDelete
   * Summary: Delete a sessions, from users {userId}, from admin
   * Description: Deletes every session of the user, so each of their devices must sign in again.
   */

  router.delete(
    '/users/:userId/sessions' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminUsersUserIdSessionsDelete'),
    /* Validate the request data and return validation errors */
    celebrate(adminUserIdValidators.adminUsersUserIdSessionsDelete),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminUserIdDomain.adminUsersUserIdSessionsDelete(req.params, req),
        200,
        'application/json',
        adminUserIdTransformOutputs.adminUsersUserIdSessionsDelete
      );
    }
  );

  /**
   * Operation ID: adminUsersUserIdSessionsGet
   * Summary: Get sessions, from users {userId}, from admin
   *
   */

  router.get(
    '/users/:userId/sessions' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminUsersUserIdSessionsRead'),
    /* Validate the request data and return validation errors */
    celebrate(adminUserIdValidators.adminUsersUserIdSessionsGet),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminUserIdDomain.adminUsersUserIdSessionsGet(req.params, req),
        200,
        'application/json',
        adminUserIdTransformOutputs.adminUsersUserIdSessionsGet
      );
    }
  );

  return router;
}
