import { SetupAdminPostPost, User } from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface SetupDomainInterface {
  /**
   * Operation ID: setupAdminPost
   * Summary: Create a admin, from setup
   * Description: Grants SUPER_ADMIN to the signed-in user when the key matches the environment's setup key and no administrator
exists yet. Refused with 409 once there is one and 403 for a wrong key, so the key is useless after the claim.
   * Permission string: apiSetupAdminCreate
  **/
  setupAdminPost(body: SetupAdminPostPost, req: any): Promise<User>;
}
