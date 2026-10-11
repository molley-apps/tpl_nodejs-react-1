import config from '@/config';
import express from 'express';
import healthRoutes from './routes/healthRoutes';
import userRoutes from './routes/userRoutes';

export interface RoutesImporter {
  basePath?: string
}

export const baseUrl = '/api';

export default function (app: express.Application, options: RoutesImporter = {basePath: baseUrl}) {
  const basePath = (options.basePath || '').replace(/\/+$/, '');

  app.use(basePath + '/health', healthRoutes());

  app.use(basePath + '/user', userRoutes());

  }
