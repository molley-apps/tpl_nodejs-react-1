import {
  AdminSettingsEmail,
  AdminSettingsEmailPutPut,
  AdminSettingsEmailTest,
  GenericDeleteSuccess,
} from '@/http/nodegen/interfaces';

import { AdminEmailDomainInterface } from '@/http/nodegen/domainInterfaces/AdminEmailDomainInterface';

import NodegenRequest from '@/http/interfaces/NodegenRequest';
import EmailSettingsService from '@/services/EmailSettingsService';

class AdminEmailDomain implements AdminEmailDomainInterface {
  public async adminSettingsEmailDelete(req: NodegenRequest): Promise<GenericDeleteSuccess> {
    await EmailSettingsService.clear();
    return { success: true };
  }

  public async adminSettingsEmailGet(req: NodegenRequest): Promise<AdminSettingsEmail> {
    return EmailSettingsService.get();
  }

  public async adminSettingsEmailPut(body: AdminSettingsEmailPutPut, req: NodegenRequest): Promise<AdminSettingsEmail> {
    return EmailSettingsService.save(body, req.sessionData.userId);
  }

  public async adminSettingsEmailTestPost(req: NodegenRequest): Promise<AdminSettingsEmailTest> {
    const { email, name } = req.sessionData.user;
    return EmailSettingsService.test({ email, name });
  }
}

export default new AdminEmailDomain();
