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

import { AdminUserIdDomainInterface } from '@/http/nodegen/domainInterfaces/AdminUserIdDomainInterface';

import NodegenRequest from '@/http/interfaces/NodegenRequest';
import AdminUserService from '@/services/AdminUserService';

class AdminUserIdDomain implements AdminUserIdDomainInterface {
  public async adminUsersUserIdDelete(
    params: AdminUsersUserIdDeletePath,
    req: NodegenRequest,
  ): Promise<GenericDeleteSuccess> {
    await AdminUserService.deleteUser({ actorId: req.sessionData.userId, userId: params.userId });
    return { success: true };
  }

  public async adminUsersUserIdRolesPut(
    body: AdminUsersUserIdRolesPutPut,
    params: AdminUsersUserIdRolesPutPath,
    req: NodegenRequest,
  ): Promise<User> {
    return AdminUserService.setRoles({ actorId: req.sessionData.userId, userId: params.userId, roles: body.roles });
  }

  public async adminUsersUserIdSessionsDelete(
    params: AdminUsersUserIdSessionsDeletePath,
    req: NodegenRequest,
  ): Promise<GenericDeleteSuccess> {
    await AdminUserService.signOutEverywhere(params.userId);
    return { success: true };
  }

  public async adminUsersUserIdSessionsGet(
    params: AdminUsersUserIdSessionsGetPath,
    req: NodegenRequest,
  ): Promise<AdminSessions> {
    return AdminUserService.sessionsFor(params.userId);
  }
}

export default new AdminUserIdDomain();
