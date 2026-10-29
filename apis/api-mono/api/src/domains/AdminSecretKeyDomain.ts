import {
  AdminSecret,
  AdminSecretsSecretKeyDeletePath,
  AdminSecretsSecretKeyPutPath,
  AdminSecretsSecretKeyPutPut,
  GenericDeleteSuccess,
} from '@/http/nodegen/interfaces';

import { AdminSecretKeyDomainInterface } from '@/http/nodegen/domainInterfaces/AdminSecretKeyDomainInterface';

import NodegenRequest from '@/http/interfaces/NodegenRequest';
import AppSecretsService from '@/services/AppSecretsService';

class AdminSecretKeyDomain implements AdminSecretKeyDomainInterface {
  public async adminSecretsSecretKeyDelete(
    params: AdminSecretsSecretKeyDeletePath,
    req: NodegenRequest,
  ): Promise<GenericDeleteSuccess> {
    await AppSecretsService.remove(params.secretKey);
    return { success: true };
  }

  public async adminSecretsSecretKeyPut(
    body: AdminSecretsSecretKeyPutPut,
    params: AdminSecretsSecretKeyPutPath,
    req: NodegenRequest,
  ): Promise<AdminSecret> {
    return AppSecretsService.save(params.secretKey, body, req.sessionData.userId);
  }
}

export default new AdminSecretKeyDomain();
