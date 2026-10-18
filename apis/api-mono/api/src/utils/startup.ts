import path from 'path';
import process from 'process';
import config from '@/config';
import { emailerSetupAsync } from 'nunjucks-emailer';
import { EmailerConstructor } from 'nunjucks-emailer/build/interfaces/EmailerContructor';
import { runMigrations } from '@/utils/migrationRunner';
import AuthService from '@/services/AuthService';
import MongoConnectionService from '@/services/MongoConnectionService';
import ScheduleService from '@/services/ScheduleService';

export default async () => {
  // Load all database connections
  await MongoConnectionService.connect();
  console.log('Mongo atlas database connection established: ' + config.mongoDb.mongoHost);

  // Run database migrations
  await runMigrations();

  // Build the auth layer now so a bad AUTH_* config fails the boot, not the first login
  AuthService.getInstance();
  console.log(
    `Auth: Better Auth serving ${config.auth.basePath}/* for origins ${config.auth.trustedOrigins.join(', ')}`,
  );

  // Surfaced at boot so a deployment pointing at the wrong bucket (or none) is visible in the logs.
  console.log(
    config.env === 'local'
      ? `Frontends: serving from ${config.frontends.localDir}/<app>/dist (NODE_ENV=local)`
      : `Frontends: serving from gs://${config.gcs.bucketName || '<GCS_FRONTEND_BUCKET not set>'}`,
  );

  // Setup the emailer
  const emailerSetup: EmailerConstructor = {
    templatePath: path.join(process.cwd(), 'emails/templates'),
    logPath: path.join(process.cwd(), 'emails/logs'),
    sendType: config.email.mode,
    fallbackFrom: {
      email: config.email.fallbackFrom,
      name: config.appDetails.name,
    },
    fallbackSubject: config.appDetails.name,
    makeCssInline: true,
    makeCssInlineOptions: {
      url: config.appDetails.frontend.userApp,
      preserveMediaQueries: true,
    },
    templateGlobalObject: {
      appName: config.appDetails.name,
      frontend: config.appDetails.frontend,
      noReply: config.email.fallbackFrom,
    },
    nodemailer: {
      port: config.email.nodemailer.port,
      host: config.email.nodemailer.host,
      secure: config.email.nodemailer.secure,
      auth:
        config.email.nodemailer.auth.user && config.email.nodemailer.auth.pass
          ? config.email.nodemailer.auth
          : undefined,
    },
  };

  await emailerSetupAsync(emailerSetup);
  console.log(
    `Setup email: EmailerSetupAsync in mode '${config.email.mode}' with fallbacks as ${JSON.stringify(config.email.fallbackFrom)}`,
  );

  // Scheduled jobs: records for the code's jobs, Cloud Scheduler jobs for the enabled ones. A Scheduler API failure
  // (eg roles not applied yet) is logged, not fatal: the API still serves and the next start retries.
  try {
    await ScheduleService.reconcile();
  } catch (e) {
    console.error('Scheduled jobs: reconcile failed', e);
  }
  if (config.env === 'local') {
    ScheduleService.startLocalTimer();
  }
};
