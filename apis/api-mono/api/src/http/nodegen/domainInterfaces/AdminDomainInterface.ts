import { AdminUsersGetQuery, Users } from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface AdminDomainInterface {
  /**
   * Operation ID: adminUsersGet
   * Summary: Get users, from admin
   * Description: Everyone with an account, newest first. Search matches email and name; role filters on a system role.
   * Permission string: apiAdminUsersRead
   **/
  adminUsersGet(query: AdminUsersGetQuery, req: any): Promise<Users>;
}
