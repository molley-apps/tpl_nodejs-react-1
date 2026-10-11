import { Health } from '@/http/nodegen/interfaces';

export interface HealthDomainInterface {
  /**
   * Operation ID: healthGet
   * Summary: Get health
   * Description: No description written
   * No additional middleware used
   **/
  healthGet(): Promise<Health>;
}
