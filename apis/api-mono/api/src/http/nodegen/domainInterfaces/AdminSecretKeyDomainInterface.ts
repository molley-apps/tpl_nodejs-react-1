import {
  AdminSecret,
  AdminSecretsSecretKeyDeletePath,
  AdminSecretsSecretKeyPutPath,
  AdminSecretsSecretKeyPutPut,
  GenericDeleteSuccess,
} from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface AdminSecretKeyDomainInterface {
  /**
   * Operation ID: adminSecretsSecretKeyDelete
   * Summary: Delete a secrets based on {secretKey}, from admin
   * Description: Deletes the secret. Any feature that needs it reports it as not configured from the next request.
   * Permission string: apiAdminSecretsSecretKeyDelete
   **/
  adminSecretsSecretKeyDelete(
    params: AdminSecretsSecretKeyDeletePath,
    req: any
  ): Promise<GenericDeleteSuccess>;

  /**
   * Operation ID: adminSecretsSecretKeyPut
   * Summary: Update a secrets based on {secretKey}, from admin
   * Description: Stores the value encrypted under the given name. The code reads it with AppSecretsService.get(name) on each
use, so a new value applies at once, without a redeploy. Omit the value to change only the description.
   * Permission string: apiAdminSecretsSecretKeyUpdate
  **/
  adminSecretsSecretKeyPut(
    body: AdminSecretsSecretKeyPutPut,
    params: AdminSecretsSecretKeyPutPath,
    req: any
  ): Promise<AdminSecret>;
}
