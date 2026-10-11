import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, Method, } from 'axios';
import AuthService from './AuthService';

export interface RequestObject {
  method: string;
  path: string;
  formData?: object;
  params?: object;
  qs?: object;
  body?: object;
  headers?: object;
  baseUrl?: string;
}

export default class HttpService {
  private static httpClassSetup = false;
  private static baseApiUrl: string = '';
  private static on500ErrorNotification: () => void;

  static setup (input: {
    baseApiUrl: string,
    on500ErrorNotification: () => void,
    on401ErrorNotification?: () => void
  }) {
    HttpService.baseApiUrl = input.baseApiUrl;
    HttpService.setupAxiosInterceptors();
    HttpService.on500ErrorNotification = input.on500ErrorNotification;
    HttpService.httpClassSetup = true;
    AuthService.setup({
      baseApiUrl: input.baseApiUrl,
      onLogout: input.on401ErrorNotification,
    });
  }

  static async sendRequest (requestObject: RequestObject): Promise<any> {
    if (!HttpService.httpClassSetup) {
      throw new Error('You must call HttpService.setup beforehand');
    }

    const baseUrl = requestObject.baseUrl || HttpService.baseApiUrl;
    const path = HttpService.injectParamsToPath(requestObject.params, requestObject.path);
    // If baseUrl is empty/undefined, use path as-is (absolute from domain root)
    const URL = baseUrl ? baseUrl + path : path;

    const axiosReq: AxiosRequestConfig = {
      headers: {
        ...requestObject.headers,
      },
      method: requestObject.method as Method,
      data: requestObject.body || {},
      params: requestObject.qs || {},
      url: URL,
      withCredentials: true,
    };

    return axios(axiosReq)
      .then((response: AxiosResponse) => response.data)
      .catch((err: AxiosError) => {
        throw err;
      });
  }

  /** The Better Auth sign out route, a 401 from it must not trigger another sign out */
  static isLogoutRoute (url: string): boolean {
    return /\/api\/auth\/sign-out/.test(url);
  }

  static injectParamsToPath (params: Record<any, any> = {}, path: string) {
    Object.keys(params).forEach((param) => {
      path = path.replace(':' + param, params[param]);
    });
    return path;
  }

  static setupAxiosInterceptors () {
    axios.defaults.withCredentials = true;

    axios.interceptors.request.use(
      HttpService.preRequestCheck.bind(this),
      (e) => Promise.reject(e)
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          return HttpService.handle401(error);
        } else if (error.response?.status === 500) {
          return HttpService.handle500(error);
        }
        return Promise.reject(error);
      }
    );
  }

  static async preRequestCheck (
    axiosConfig: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    axiosConfig.withCredentials = true;
    return axiosConfig;
  }

  static async handle401 (err: any) {
    if (
      err.response?.status === 401 &&
      !HttpService.isLogoutRoute(err.request?.responseURL || '')
    ) {
      await AuthService.logout();
    }
    return Promise.reject(err);
  }

  static async logout (): Promise<void> {
    await AuthService.logout();
  }

  static handle500 (err: any) {
    if (err.response?.status === 500) {
      HttpService.on500ErrorNotification();
    }
    return Promise.reject(err);
  }
}
