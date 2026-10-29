import { Meta } from '@/http/nodegen/interfaces';

import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface MetaDomainInterface {
  /**
   * Operation ID: metaGet
   * Summary: Get meta
   * Description: What the users app needs before anyone is signed in: the app's name and the feature flags that decide which
options to show (eg password reset only when outgoing email works). Readable by anyone, so it carries flags
and labels only, never configuration values or secrets.
   * Permission string: apiMetaRead
  **/
  metaGet(req: any): Promise<Meta>;
}
