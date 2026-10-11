/**
 * Application configuration
 * Environment variables are prefixed with VITE_ to be exposed to the client
 */

export enum Environment {
  Development = 'development',
  Production = 'production',
}

const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;

export const config = {
  // Environment
  env: import.meta.env.PROD ? Environment.Production : Environment.Development,

  app: {
    baseUrl: baseUrl,
    // The product name; the navbar labels this console "<name> Admin"
    name: 'App Template',
  },
  api: {
    baseApiUrl: import.meta.env.VITE_API_BASE_URL as string,
    // API base path for generated API clients
    basePath: import.meta.env.VITE_API_BASE_PATH as string,
  },
} as const;

// Default export for backward compatibility
export default config;
