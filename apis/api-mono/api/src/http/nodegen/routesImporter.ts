import config from '@/config';
import express from 'express';
import adminRoutes from './routes/adminRoutes';
import adminNameRoutes from './routes/adminNameRoutes';
import adminSecretKeyRoutes from './routes/adminSecretKeyRoutes';
import adminEmailRoutes from './routes/adminEmailRoutes';
import adminUserIdRoutes from './routes/adminUserIdRoutes';
import healthRoutes from './routes/healthRoutes';
import internalNameRoutes from './routes/internalNameRoutes';
import metaRoutes from './routes/metaRoutes';
import setupRoutes from './routes/setupRoutes';
import userRoutes from './routes/userRoutes';

export interface RoutesImporter {
  basePath?: string
}

export const baseUrl = '/api';

export default function (app: express.Application, options: RoutesImporter = {basePath: baseUrl}) {
  const basePath = (options.basePath || '').replace(/\/+$/, '');

  app.use(basePath + '/admin', adminRoutes());

  app.use(basePath + '/admin', adminNameRoutes());

  app.use(basePath + '/admin', adminSecretKeyRoutes());

  app.use(basePath + '/admin', adminEmailRoutes());

  app.use(basePath + '/admin', adminUserIdRoutes());

  app.use(basePath + '/health', healthRoutes());

  app.use(basePath + '/internal', internalNameRoutes());

  app.use(basePath + '/meta', metaRoutes());

  app.use(basePath + '/setup', setupRoutes());

  app.use(basePath + '/user', userRoutes());

  }
