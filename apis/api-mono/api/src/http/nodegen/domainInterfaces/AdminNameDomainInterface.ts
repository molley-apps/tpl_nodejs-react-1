import {
  AdminSchedule,
  AdminSchedulesNamePutPath,
  AdminSchedulesNamePutPut,
  AdminSchedulesNameRunPostPath,
} from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface AdminNameDomainInterface {
  /**
   * Operation ID: adminSchedulesNamePut
   * Summary: Update a schedules based on {name}, from admin
   * Description: Saves the cron expression, timezone and enabled flag. Enabling creates the Cloud Scheduler job in this environment,
disabling deletes it. Nothing runs while a job is disabled.
   * Permission string: apiAdminSchedulesNameUpdate
  **/
  adminSchedulesNamePut(
    body: AdminSchedulesNamePutPut,
    params: AdminSchedulesNamePutPath,
    req: any
  ): Promise<AdminSchedule>;

  /**
   * Operation ID: adminSchedulesNameRunPost
   * Summary: Create a run, from schedules {name}, from admin
   * Description: Executes the job immediately in this request, whether or not it is enabled, and returns the recorded run. Skipped when the job is already running.
   * Permission string: apiAdminSchedulesNameRunCreate
   **/
  adminSchedulesNameRunPost(
    params: AdminSchedulesNameRunPostPath,
    req: any
  ): Promise<AdminSchedule>;
}
