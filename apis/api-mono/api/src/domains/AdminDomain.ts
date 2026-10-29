import { AdminSchedules, AdminSecrets, AdminUsersGetQuery, Users } from '@/http/nodegen/interfaces';

import { AdminDomainInterface } from '@/http/nodegen/domainInterfaces/AdminDomainInterface';

import NodegenRequest from '@/http/interfaces/NodegenRequest';
import AdminUserService from '@/services/AdminUserService';
import AppSecretsService from '@/services/AppSecretsService';
import ScheduleService from '@/services/ScheduleService';

class AdminDomain implements AdminDomainInterface {
  public async adminSchedulesGet(req: NodegenRequest): Promise<AdminSchedules> {
    return ScheduleService.list();
  }

  public async adminSecretsGet(req: NodegenRequest): Promise<AdminSecrets> {
    return AppSecretsService.list();
  }

  public async adminUsersGet(query: AdminUsersGetQuery, req: NodegenRequest): Promise<Users> {
    return AdminUserService.list(query);
  }
}

export default new AdminDomain();
