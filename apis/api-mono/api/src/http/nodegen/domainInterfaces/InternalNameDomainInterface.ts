import {
  InternalJobsNamePostPath,
  InternalJobsRun,
} from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface InternalNameDomainInterface {
  /**
   * Operation ID: internalJobsNamePost
   * Summary: Create a jobs based on {name}, from internal
   * Description: Called by Cloud Scheduler with an OIDC token for this environment's invoker service account; anything else is 401.
Runs the job once (a concurrent or retried call is skipped) and answers 200 even when the job itself failed, so
Scheduler does not retry an application failure.
   * Permission string: apiInternalJobsNameCreate
  **/
  internalJobsNamePost(
    params: InternalJobsNamePostPath,
    req: any
  ): Promise<InternalJobsRun>;
}
