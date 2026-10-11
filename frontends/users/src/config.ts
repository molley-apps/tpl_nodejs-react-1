const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;

export default {
  app: {
    baseUrl: baseUrl,
    name: 'App Template',
  },
  api: {
    baseApiUrl: import.meta.env.VITE_API_BASE_URL as string,
    basePath: import.meta.env.VITE_API_BASE_PATH as string,
  },
  env: import.meta.env.MODE,
};
