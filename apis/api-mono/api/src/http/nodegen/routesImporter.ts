import config from '@/config';
import express from 'express';
import adminRoutes from './routes/adminRoutes';
import adminNameRoutes from './routes/adminNameRoutes';
import adminEmailRoutes from './routes/adminEmailRoutes';
import adminUserIdRoutes from './routes/adminUserIdRoutes';
import capabilitiesRoutes from './routes/capabilitiesRoutes';
import healthRoutes from './routes/healthRoutes';
import internalNameRoutes from './routes/internalNameRoutes';
import userRoutes from './routes/userRoutes';

export interface RoutesImporter {
  basePath?: string
}

export const baseUrl = '/api';

export default function (app: express.Application, options: RoutesImporter = {basePath: baseUrl}) {
  const basePath = (options.basePath || '').replace(/\/+$/, '');

  app.use(basePath + '/admin', adminRoutes());

  app.use(basePath + '/admin', adminNameRoutes());

  app.use(basePath + '/admin', adminEmailRoutes());

  app.use(basePath + '/admin', adminUserIdRoutes());

  app.use(basePath + '/capabilities', capabilitiesRoutes());

  app.use(basePath + '/health', healthRoutes());

  app.use(basePath + '/internal', internalNameRoutes());

  app.use(basePath + '/user', userRoutes());

  }
