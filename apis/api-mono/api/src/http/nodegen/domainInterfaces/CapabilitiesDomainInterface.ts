import { Capabilities } from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface CapabilitiesDomainInterface {
  /**
   * Operation ID: capabilitiesGet
   * Summary: Get capabilities
   * Description: Public. The users app reads it before showing flows that depend on them, eg password reset needs email.
   * Permission string: apiCapabilitiesRead
   **/
  capabilitiesGet(req: any): Promise<Capabilities>;
}
