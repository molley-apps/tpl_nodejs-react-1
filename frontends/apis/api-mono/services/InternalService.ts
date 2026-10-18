import HttpService from 'services/src/HttpService';
import { BaseApiService } from './BaseApiService';

import { InternalJobsNamePostPath } from './interfaces/InternalJobsNamePostPath';
import { InternalJobsRun } from './interfaces/InternalJobsRun';

export default class InternalService extends BaseApiService {
  /**
   *  Operation ID: internalJobsNamePost
   *  Summary: Create a jobs based on {name}, from internal
   *  Description: Called by Cloud Scheduler with an OIDC token for this environment's invoker service account; anything else is 401.
Runs the job once (a concurrent or retried call is skipped) and answers 200 even when the job itself failed, so
Scheduler does not retry an application failure.

   */
  public static internalJobsNamePost(
    pathParams: InternalJobsNamePostPath
  ): Promise<InternalJobsRun> {
    return HttpService.sendRequest({
      method: 'POST',
      path: InternalService.basePath + 'internal/jobs/:name',
      params: pathParams,
    });
  }
}
