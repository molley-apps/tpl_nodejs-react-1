import {
  AdminSchedules,
  AdminUsersGetQuery,
  Users,
} from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface AdminDomainInterface {
  /**
   * Operation ID: adminSchedulesGet
   * Summary: Get schedules, from admin
   * Description: One row per job registered in the code (src/jobs), with the administrator-owned schedule, the last run and the next run.
   * Permission string: apiAdminSchedulesRead
   **/
  adminSchedulesGet(req: any): Promise<AdminSchedules>;

  /**
   * Operation ID: adminUsersGet
   * Summary: Get users, from admin
   * Description: Everyone with an account, newest first. Search matches email and name; role filters on a system role.
   * Permission string: apiAdminUsersRead
   **/
  adminUsersGet(query: AdminUsersGetQuery, req: any): Promise<Users>;
}
