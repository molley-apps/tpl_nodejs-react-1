import HttpService from 'services/src/HttpService';
import { BaseApiService } from './BaseApiService';

import { AdminSessions } from './interfaces/AdminSessions';
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
