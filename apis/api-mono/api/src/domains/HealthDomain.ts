import { Health } from '@/http/nodegen/interfaces';

import { HealthDomainInterface } from '@/http/nodegen/domainInterfaces/HealthDomainInterface';

class HealthDomain implements HealthDomainInterface {
  public async healthGet(): Promise<Health> {
    return {
      http: true,
    };
  }
}

export default new HealthDomain();
