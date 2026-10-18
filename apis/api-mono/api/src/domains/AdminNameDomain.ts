import {
  AdminSchedule,
  AdminSchedulesNamePutPath,
  AdminSchedulesNamePutPut,
  AdminSchedulesNameRunPostPath,
} from '@/http/nodegen/interfaces';

import { AdminNameDomainInterface } from '@/http/nodegen/domainInterfaces/AdminNameDomainInterface';

import NodegenRequest from '@/http/interfaces/NodegenRequest';
import ScheduleService from '@/services/ScheduleService';

class AdminNameDomain implements AdminNameDomainInterface {
  public async adminSchedulesNamePut(
    body: AdminSchedulesNamePutPut,
    params: AdminSchedulesNamePutPath,
    req: NodegenRequest,
  ): Promise<AdminSchedule> {
    return ScheduleService.update(params.name, body, req.sessionData.userId);
  }

  public async adminSchedulesNameRunPost(
    params: AdminSchedulesNameRunPostPath,
    req: NodegenRequest,
  ): Promise<AdminSchedule> {
    return ScheduleService.runNow(params.name, req.sessionData.userId);
  }
}

export default new AdminNameDomain();
