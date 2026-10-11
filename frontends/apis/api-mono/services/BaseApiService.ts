/**
 * Base API Service
 *
 * This class provides a centralized way to configure the base path for all API services.
 * Each frontend app should call BaseApiService.configure() on startup with their config.
 *
 * Usage in frontend app:
 * ```typescript
 * import { BaseApiService } from 'apis/api-mono/services/BaseApiService';
 * import { config } from '@/config';
 *
 * // On app initialization
 * BaseApiService.configure({
 *   url: config.api.url,
 *   basePath: config.api.basePath
 * });
 * ```
 */

export interface ApiConfig {
  url?: string;
  basePath?: string;
}

export class BaseApiService {
  private static _basePath: string = '';
  private static _configured: boolean = false;

  /**
   * Configure the base path for all API services
   * This should be called once during app initialization
   */
  public static configure (config: ApiConfig): void {
    const normalizedBasePath = BaseApiService.normalizeBasePath(config.basePath);
    const normalizedUrl = (config.url || '').trim().replace(/\/+$/, '');

    BaseApiService._basePath = normalizedUrl ? normalizedUrl + normalizedBasePath : normalizedBasePath;
    BaseApiService._configured = true;
  }

  private static normalizeBasePath (basePath?: string): string {
    const raw = (basePath || '').trim();
    const safeBasePath = raw && raw !== 'undefined' && raw !== 'null' ? raw : '/api/';
    const withLeadingSlash = safeBasePath.startsWith('/') ? safeBasePath : `/${safeBasePath}`;

    return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
  }

  /**
   * Get the configured base path
   * Throws an error if configure() hasn't been called
   */
  protected static get basePath (): string {
    if (!BaseApiService._configured) {
      throw new Error(
        'BaseApiService not configured. Call BaseApiService.configure() during app initialization.'
      );
    }
    return BaseApiService._basePath;
  }
}
