import {
  AdminSettingsEmail,
  AdminSettingsEmailPutPut,
  AdminSettingsEmailTest,
  GenericDeleteSuccess,
} from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface AdminEmailDomainInterface {
  /**
   * Operation ID: adminSettingsEmailDelete
   * Summary: Delete a email, from settings, from admin
   * Description: Clears the provider and secret. The app runs without outgoing email until new settings are saved and verified.
   * Permission string: apiAdminSettingsEmailDelete
   **/
  adminSettingsEmailDelete(req: any): Promise<GenericDeleteSuccess>;

  /**
   * Operation ID: adminSettingsEmailGet
   * Summary: Get email, from settings, from admin
   * Description: The configured provider without its secret, plus whether it is configured and verified by a test send.
   * Permission string: apiAdminSettingsEmailRead
   **/
  adminSettingsEmailGet(req: any): Promise<AdminSettingsEmail>;

  /**
   * Operation ID: adminSettingsEmailPut
   * Summary: Update a email, from settings, from admin
   * Description: Stores the provider, encrypted secret and from address. Omit the password to keep the stored one.
Saving resets verification: send a test email afterwards to switch sending on.
   * Permission string: apiAdminSettingsEmailUpdate
  **/
  adminSettingsEmailPut(
    body: AdminSettingsEmailPutPut,
    req: any
  ): Promise<AdminSettingsEmail>;

  /**
   * Operation ID: adminSettingsEmailTestPost
   * Summary: Create a test, from email, from settings, from admin
   * Description: Sends the test template through the saved settings to the caller's own address. A success marks the settings
verified and switches outgoing email on; a failure returns the provider's response verbatim.
   * Permission string: apiAdminSettingsEmailTestCreate
  **/
  adminSettingsEmailTestPost(req: any): Promise<AdminSettingsEmailTest>;
}
