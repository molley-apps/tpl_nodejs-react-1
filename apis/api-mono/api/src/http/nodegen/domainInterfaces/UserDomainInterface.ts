import { User, UserCurrentPutPut } from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface UserDomainInterface {
  /**
   * Operation ID: userCurrentGet
   * Summary: Get current, from user
   * Description: No description written
   * Permission string: apiUserCurrentRead
   **/
  userCurrentGet(req: any): Promise<User>;

  /**
   * Operation ID: userCurrentPut
   * Summary: Update a current, from user
   * Description: No description written
   * Permission string: apiUserCurrentUpdate
   **/
  userCurrentPut(body: UserCurrentPutPut, req: any): Promise<User>;
}
