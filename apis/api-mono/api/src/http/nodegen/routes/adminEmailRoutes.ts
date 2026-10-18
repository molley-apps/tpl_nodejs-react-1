import express from 'express';

import { celebrate } from 'celebrate';

import permissionMiddleware from '../middleware/permissionMiddleware';

import adminEmailValidators from '../validators/adminEmailValidators';
import AdminEmailDomain from '../../../domains/AdminEmailDomain';
import adminEmailTransformOutputs from '../transformOutputs/adminEmailTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = express.Router();

  /**
   * Operation ID: adminSettingsEmailDelete
   * Summary: Delete a email, from settings, from admin
   * Description: Clears the provider and secret. The app runs without outgoing email until new settings are saved and verified.
   */

  router.delete(
    '/settings/email' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSettingsEmailDelete'),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminEmailDomain.adminSettingsEmailDelete(req),
        200,
        'application/json',
        adminEmailTransformOutputs.adminSettingsEmailDelete
      );
    }
  );

  /**
   * Operation ID: adminSettingsEmailGet
   * Summary: Get email, from settings, from admin
   * Description: The configured provider without its secret, plus whether it is configured and verified by a test send.
   */

  router.get(
    '/settings/email' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSettingsEmailRead'),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminEmailDomain.adminSettingsEmailGet(req),
        200,
        'application/json',
        adminEmailTransformOutputs.adminSettingsEmailGet
      );
    }
  );

  /**
       * Operation ID: adminSettingsEmailPut
       * Summary: Update a email, from settings, from admin
       * Description: Stores the provider, encrypted secret and from address. Omit the password to keep the stored one.
Saving resets verification: send a test email afterwards to switch sending on.
       */

  router.put(
    '/settings/email' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSettingsEmailUpdate'),
    /* Validate the request data and return validation errors */
    celebrate(adminEmailValidators.adminSettingsEmailPut),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminEmailDomain.adminSettingsEmailPut(req.body, req),
        200,
        'application/json',
        adminEmailTransformOutputs.adminSettingsEmailPut
      );
    }
  );

  /**
       * Operation ID: adminSettingsEmailTestPost
       * Summary: Create a test, from email, from settings, from admin
       * Description: Sends the test template through the saved settings to the caller's own address. A success marks the settings
verified and switches outgoing email on; a failure returns the provider's response verbatim.
       */

  router.post(
    '/settings/email/test' /* x-raw-body on path not found: Format the body */,
    express.json({
      limit: '50mb',
    }) /* x-permission on path found: Check permission of the incoming user */,
    permissionMiddleware('apiAdminSettingsEmailTestCreate'),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await AdminEmailDomain.adminSettingsEmailTestPost(req),
        200,
        'application/json',
        adminEmailTransformOutputs.adminSettingsEmailTestPost
      );
    }
  );

  return router;
}
