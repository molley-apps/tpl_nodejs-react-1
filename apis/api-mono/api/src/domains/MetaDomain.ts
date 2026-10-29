import { Meta } from '@/http/nodegen/interfaces';

import { MetaDomainInterface } from '@/http/nodegen/domainInterfaces/MetaDomainInterface';

import config from '@/config';
import NodegenRequest from '@/http/interfaces/NodegenRequest';
import EmailService from '@/services/EmailService';

/**
 * GET /meta is public (no session), read by the users app before sign in. Everything here is visible to the
 * whole internet: names and feature flags only, never a configuration value or secret.
 */
class MetaDomain implements MetaDomainInterface {
  public async metaGet(req: NodegenRequest): Promise<Meta> {
    return {
      appName: config.appDetails.name,
      features: { email: await EmailService.isEnabled() },
    };
  }
}

export default new MetaDomain();
