import HttpService from 'services/src/HttpService';
import { BaseApiService } from './BaseApiService';

import { SetupAdminPostPost } from './interfaces/SetupAdminPostPost';
import { User } from './interfaces/User';

export default class SetupService extends BaseApiService {
  /**
   *  Operation ID: setupAdminPost
   *  Summary: Create a admin, from setup
   *  Description: Grants SUPER_ADMIN to the signed-in user when the key matches the environment's setup key and no administrator
exists yet. Refused with 409 once there is one and 403 for a wrong key, so the key is useless after the claim.

   */
  public static setupAdminPost(body: SetupAdminPostPost): Promise<User> {
    return HttpService.sendRequest({
      method: 'POST',
      path: SetupService.basePath + 'setup/admin',
      body,
    });
  }
}
