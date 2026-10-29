import {
  AdminSchedules,
  AdminSecrets,
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
   * Operation ID: adminSecretsGet
   * Summary: Get secrets, from admin
   * Description: Every secret the administrator has saved (API keys and tokens for outside services the app integrates with),
without their values: only the last four characters are ever returned.
   * Permission string: apiAdminSecretsRead
  **/
  adminSecretsGet(req: any): Promise<AdminSecrets>;

  /**
   * Operation ID: adminUsersGet
   * Summary: Get users, from admin
   * Description: Everyone with an account, newest first. Search matches email and name; role filters on a system role.
   * Permission string: apiAdminUsersRead
   **/
  adminUsersGet(query: AdminUsersGetQuery, req: any): Promise<Users>;
}
