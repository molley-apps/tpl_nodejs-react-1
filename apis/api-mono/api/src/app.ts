import http, { Http } from '@/http';
import { buildHttpOptions } from '@/utils/buildHttpOptions';

// Main export to start the app
export default async (port: number): Promise<Http> => {
  // NB: db connections live in startup() and are intentionally NOT awaited
  // here, so the caller can open the port before the DB connection is up.
  // To inject custom middleware see buildHttpOptions and the HttpOptions interface in @/http/index.ts
  return http(port, buildHttpOptions());
};
