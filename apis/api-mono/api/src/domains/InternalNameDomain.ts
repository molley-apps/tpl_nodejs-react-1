import { InternalJobsNamePostPath, InternalJobsRun } from '@/http/nodegen/interfaces';

import { InternalNameDomainInterface } from '@/http/nodegen/domainInterfaces/InternalNameDomainInterface';

import NodegenRequest from '@/http/interfaces/NodegenRequest';
import ScheduleService from '@/services/ScheduleService';

class InternalNameDomain implements InternalNameDomainInterface {
  public async internalJobsNamePost(params: InternalJobsNamePostPath, req: NodegenRequest): Promise<InternalJobsRun> {
    return ScheduleService.runFromScheduler(params.name);
  }
}

export default new InternalNameDomain();
