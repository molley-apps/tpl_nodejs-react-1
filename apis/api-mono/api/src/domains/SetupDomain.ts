import { SetupAdminPostPost, User } from '@/http/nodegen/interfaces';

import { SetupDomainInterface } from '@/http/nodegen/domainInterfaces/SetupDomainInterface';

import NodegenRequest from '@/http/interfaces/NodegenRequest';
import AdminSetupService from '@/services/AdminSetupService';

class SetupDomain implements SetupDomainInterface {
  public async setupAdminPost(body: SetupAdminPostPost, req: NodegenRequest): Promise<User> {
    return AdminSetupService.claim({ userId: req.sessionData.userId, key: body.key });
  }
}

export default new SetupDomain();
