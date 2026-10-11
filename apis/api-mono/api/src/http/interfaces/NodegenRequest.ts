import express from 'express';
import { SessionData } from '@/services/SessionService';

declare global {
  namespace Express {
    export interface Request {
      jwtData: any;
      originalToken: string;
      clientIp?: string;

      // sessionData is defined in SessionService outside of the http layer and is set by the
      // authentication middleware injected via AppMiddlewareOptions.authentication
      sessionData: SessionData;
    }
  }
}

type NodegenRequest = express.Request;
export default NodegenRequest;
