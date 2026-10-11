import HttpService from 'services/src/HttpService';
import { BaseApiService } from './BaseApiService';

import { Health } from './interfaces/Health';

export default class HealthService extends BaseApiService {
  /**
   *  Operation ID: healthGet
   *  Summary: Get health
   *  Description:
   */
  public static healthGet(): Promise<Health> {
    return HttpService.sendRequest({
      method: 'GET',
      path: HealthService.basePath + 'health',
    });
  }
}
