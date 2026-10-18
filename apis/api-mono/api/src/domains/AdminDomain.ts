import { AdminSchedules, AdminUsersGetQuery, Users } from '@/http/nodegen/interfaces';

import { AdminDomainInterface } from '@/http/nodegen/domainInterfaces/AdminDomainInterface';

import NodegenRequest from '@/http/interfaces/NodegenRequest';
import AdminUserService from '@/services/AdminUserService';
import ScheduleService from '@/services/ScheduleService';

class AdminDomain implements AdminDomainInterface {
  public async adminSchedulesGet(req: NodegenRequest): Promise<AdminSchedules> {
    return ScheduleService.list();
  }

  public async adminUsersGet(query: AdminUsersGetQuery, req: NodegenRequest): Promise<Users> {
    return AdminUserService.list(query);
  }
}

export default new AdminDomain();
