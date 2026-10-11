import {
  AdminSessions,
  AdminUsersUserIdDeletePath,
  AdminUsersUserIdRolesPutPath,
  AdminUsersUserIdRolesPutPut,
  AdminUsersUserIdSessionsDeletePath,
  AdminUsersUserIdSessionsGetPath,
  GenericDeleteSuccess,
  User,
} from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface AdminUserIdDomainInterface {
  /**
   * Operation ID: adminUsersUserIdDelete
   * Summary: Delete a users based on {userId}, from admin
   * Description: Removes the account, its credentials and every session. A system admin cannot delete their own account.
   * Permission string: apiAdminUsersUserIdDelete
   **/
  adminUsersUserIdDelete(
    params: AdminUsersUserIdDeletePath,
    req: any
  ): Promise<GenericDeleteSuccess>;

  /**
   * Operation ID: adminUsersUserIdRolesPut
   * Summary: Update a roles, from users {userId}, from admin
   * Description: Replaces the user's system roles. A system admin cannot remove their own SUPER_ADMIN role.
   * Permission string: apiAdminUsersUserIdRolesUpdate
   **/
  adminUsersUserIdRolesPut(
    body: AdminUsersUserIdRolesPutPut,
    params: AdminUsersUserIdRolesPutPath,
    req: any
  ): Promise<User>;

  /**
   * Operation ID: adminUsersUserIdSessionsDelete
   * Summary: Delete a sessions, from users {userId}, from admin
   * Description: Deletes every session of the user, so each of their devices must sign in again.
   * Permission string: apiAdminUsersUserIdSessionsDelete
   **/
  adminUsersUserIdSessionsDelete(
    params: AdminUsersUserIdSessionsDeletePath,
    req: any
  ): Promise<GenericDeleteSuccess>;

  /**
   * Operation ID: adminUsersUserIdSessionsGet
   * Summary: Get sessions, from users {userId}, from admin
   * Description: No description written
   * Permission string: apiAdminUsersUserIdSessionsRead
   **/
  adminUsersUserIdSessionsGet(
    params: AdminUsersUserIdSessionsGetPath,
    req: any
  ): Promise<AdminSessions>;
}
