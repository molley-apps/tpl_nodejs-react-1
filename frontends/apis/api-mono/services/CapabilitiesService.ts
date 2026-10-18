import HttpService from 'services/src/HttpService';
import { BaseApiService } from './BaseApiService';

import { Capabilities } from './interfaces/Capabilities';

export default class CapabilitiesService extends BaseApiService {
  /**
   *  Operation ID: capabilitiesGet
   *  Summary: Get capabilities
   *  Description: Public. The users app reads it before showing flows that depend on them, eg password reset needs email.
   */
  public static capabilitiesGet(): Promise<Capabilities> {
    return HttpService.sendRequest({
      method: 'GET',
      path: CapabilitiesService.basePath + 'capabilities',
    });
  }
}
