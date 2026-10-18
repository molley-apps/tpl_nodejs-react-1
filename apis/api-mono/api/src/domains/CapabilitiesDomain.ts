import { Capabilities } from '@/http/nodegen/interfaces';

import { CapabilitiesDomainInterface } from '@/http/nodegen/domainInterfaces/CapabilitiesDomainInterface';

import NodegenRequest from '@/http/interfaces/NodegenRequest';
import EmailService from '@/services/EmailService';

class CapabilitiesDomain implements CapabilitiesDomainInterface {
  public async capabilitiesGet(req: NodegenRequest): Promise<Capabilities> {
    return { email: await EmailService.isEnabled() };
  }
}

export default new CapabilitiesDomain();
