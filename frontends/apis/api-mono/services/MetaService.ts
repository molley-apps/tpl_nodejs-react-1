import HttpService from 'services/src/HttpService';
import { BaseApiService } from './BaseApiService';

import { Meta } from './interfaces/Meta';

export default class MetaService extends BaseApiService {
  /**
   *  Operation ID: metaGet
   *  Summary: Get meta
   *  Description: What the users app needs before anyone is signed in: the app's name and the feature flags that decide which
options to show (eg password reset only when outgoing email works). Readable by anyone, so it carries flags
and labels only, never configuration values or secrets.

   */
  public static metaGet(): Promise<Meta> {
    return HttpService.sendRequest({
      method: 'GET',
      path: MetaService.basePath + 'meta',
    });
  }
}
