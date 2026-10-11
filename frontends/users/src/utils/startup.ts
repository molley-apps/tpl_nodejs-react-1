import { HttpService } from 'services';
import config from '@/config.ts';
import { BaseApiService } from 'apis/api-mono/services/BaseApiService';

export default () => {
  console.log(config);
  // Setup the http service and error handling axios interceptors
  HttpService.setup({
    baseApiUrl: config.api.baseApiUrl,
    on500ErrorNotification: () => {
      console.error('Server error occurred. Please try again later.');
    },
    on401ErrorNotification: () => {
      console.warn('Session expired. Please log in again.');
    },
  });

  // Configure BaseApiService with API base URL and path
  BaseApiService.configure({
    basePath: config.api.basePath,
  });
}
