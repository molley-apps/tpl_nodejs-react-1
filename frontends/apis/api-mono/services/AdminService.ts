import HttpService from 'services/src/HttpService';
import { BaseApiService } from './BaseApiService';

import { AdminSessions } from './interfaces/AdminSessions';
import { AdminSettingsEmail } from './interfaces/AdminSettingsEmail';
import { AdminSettingsEmailPutPut } from './interfaces/AdminSettingsEmailPutPut';
import { AdminSettingsEmailTest } from './interfaces/AdminSettingsEmailTest';
import { AdminUsersGetQuery } from './interfaces/AdminUsersGetQuery';
import { AdminUsersUserIdDeletePath } from './interfaces/AdminUsersUserIdDeletePath';
import { AdminUsersUserIdRolesPutPath } from './interfaces/AdminUsersUserIdRolesPutPath';
import { AdminUsersUserIdRolesPutPut } from './interfaces/AdminUsersUserIdRolesPutPut';
import { AdminUsersUserIdSessionsDeletePath } from './interfaces/AdminUsersUserIdSessionsDeletePath';
import { AdminUsersUserIdSessionsGetPath } from './interfaces/AdminUsersUserIdSessionsGetPath';
import { GenericDeleteSuccess } from './interfaces/GenericDeleteSuccess';
import { User } from './interfaces/User';
import { Users } from './interfaces/Users';

export default class AdminService extends BaseApiService {
  /**
   *  Operation ID: adminSettingsEmailDelete
   *  Summary: Delete a email, from settings, from admin
   *  Description: Clears the provider and secret. The app runs without outgoing email until new settings are saved and verified.
   */
  public static adminSettingsEmailDelete(): Promise<GenericDeleteSuccess> {
    return HttpService.sendRequest({
      method: 'DELETE',
      path: AdminService.basePath + 'admin/settings/email',
    });
  }

  /**
   *  Operation ID: adminSettingsEmailGet
   *  Summary: Get email, from settings, from admin
   *  Description: The configured provider without its secret, plus whether it is configured and verified by a test send.
   */
  public static adminSettingsEmailGet(): Promise<AdminSettingsEmail> {
    return HttpService.sendRequest({
      method: 'GET',
      path: AdminService.basePath + 'admin/settings/email',
    });
  }

  /**
   *  Operation ID: adminSettingsEmailPut
   *  Summary: Update a email, from settings, from admin
   *  Description: Stores the provider, encrypted secret and from address. Omit the password to keep the stored one.
Saving resets verification: send a test email afterwards to switch sending on.

   */
  public static adminSettingsEmailPut(
    body: AdminSettingsEmailPutPut
  ): Promise<AdminSettingsEmail> {
    return HttpService.sendRequest({
      method: 'PUT',
      path: AdminService.basePath + 'admin/settings/email',
      body,
    });
  }

  /**
   *  Operation ID: adminSettingsEmailTestPost
   *  Summary: Create a test, from email, from settings, from admin
   *  Description: Sends the test template through the saved settings to the caller's own address. A success marks the settings
verified and switches outgoing email on; a failure returns the provider's response verbatim.

   */
  public static adminSettingsEmailTestPost(): Promise<AdminSettingsEmailTest> {
    return HttpService.sendRequest({
      method: 'POST',
      path: AdminService.basePath + 'admin/settings/email/test',
    });
  }

  /**
   *  Operation ID: adminUsersGet
   *  Summary: Get users, from admin
   *  Description: Everyone with an account, newest first. Search matches email and name; role filters on a system role.
   */
  public static adminUsersGet(query: AdminUsersGetQuery): Promise<Users> {
    return HttpService.sendRequest({
      method: 'GET',
      path: AdminService.basePath + 'admin/users',
      qs: query,
    });
  }

  /**
   *  Operation ID: adminUsersUserIdDelete
   *  Summary: Delete a users based on {userId}, from admin
   *  Description: Removes the account, its credentials and every session. A system admin cannot delete their own account.
   */
  public static adminUsersUserIdDelete(
    pathParams: AdminUsersUserIdDeletePath
  ): Promise<GenericDeleteSuccess> {
    return HttpService.sendRequest({
      method: 'DELETE',
      path: AdminService.basePath + 'admin/users/:userId',
      params: pathParams,
    });
  }

  /**
   *  Operation ID: adminUsersUserIdRolesPut
   *  Summary: Update a roles, from users {userId}, from admin
   *  Description: Replaces the user's system roles. A system admin cannot remove their own SUPER_ADMIN role.
   */
  public static adminUsersUserIdRolesPut(
    body: AdminUsersUserIdRolesPutPut,
    pathParams: AdminUsersUserIdRolesPutPath
  ): Promise<User> {
    return HttpService.sendRequest({
      method: 'PUT',
      path: AdminService.basePath + 'admin/users/:userId/roles',
      body,
      params: pathParams,
    });
  }

  /**
   *  Operation ID: adminUsersUserIdSessionsDelete
   *  Summary: Delete a sessions, from users {userId}, from admin
   *  Description: Deletes every session of the user, so each of their devices must sign in again.
   */
  public static adminUsersUserIdSessionsDelete(
    pathParams: AdminUsersUserIdSessionsDeletePath
  ): Promise<GenericDeleteSuccess> {
    return HttpService.sendRequest({
      method: 'DELETE',
      path: AdminService.basePath + 'admin/users/:userId/sessions',
      params: pathParams,
    });
  }

  /**
   *  Operation ID: adminUsersUserIdSessionsGet
   *  Summary: Get sessions, from users {userId}, from admin
   *  Description:
   */
  public static adminUsersUserIdSessionsGet(
    pathParams: AdminUsersUserIdSessionsGetPath
  ): Promise<AdminSessions> {
    return HttpService.sendRequest({
      method: 'GET',
      path: AdminService.basePath + 'admin/users/:userId/sessions',
      params: pathParams,
    });
  }
}
