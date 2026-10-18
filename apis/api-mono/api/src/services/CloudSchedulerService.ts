import { GoogleAuth } from 'google-auth-library';
import config from '@/config';
import { BadGatewayException } from '@/http/nodegen/errors';

const SCHEDULER_API = 'https://cloudscheduler.googleapis.com/v1';

export interface SchedulerJobInput {
  name: string;
  cron: string;
  timezone: string;
}

/**
 * The Cloud Scheduler jobs of this environment, one per enabled schedule, managed through the REST API with the
 * runtime service account's own credentials (Application Default Credentials; roles in deploy/terraform/sa.tf).
 * Each job POSTs to /api/internal/jobs/<name> with an OIDC token for the invoker account, which the API verifies.
 * Does nothing unless config.scheduler.enabled (deployed with a public URL and an invoker account).
 */
class CloudSchedulerService {
  private auth?: GoogleAuth;

  get enabled(): boolean {
    return config.scheduler.enabled;
  }

  /** Full resource name: projects/<p>/locations/<r>/jobs/<env>-<app>-<jobName> */
  jobName(name: string): string {
    return `${this.parent()}/jobs/${config.scheduler.jobPrefix}-${name}`;
  }

  /** Creates the job, or updates it when it already exists. Returns the resource name, or undefined when disabled. */
  async upsert(job: SchedulerJobInput): Promise<string | undefined> {
    if (!this.enabled) {
      return undefined;
    }
    const name = this.jobName(job.name);
    const body = this.body(name, job);
    try {
      await this.request('POST', `${SCHEDULER_API}/${this.parent()}/jobs`, body);
    } catch (e) {
      if (this.statusOf(e) !== 409) {
        throw this.describe(e);
      }
      const mask = 'schedule,timeZone,attemptDeadline,retryConfig,httpTarget';
      await this.request('PATCH', `${SCHEDULER_API}/${name}?updateMask=${mask}`, body).catch((err) => {
        throw this.describe(err);
      });
    }
    return name;
  }

  /** Deletes the job; a job that is already gone is fine. */
  async remove(name: string): Promise<void> {
    if (!this.enabled) {
      return;
    }
    try {
      await this.request('DELETE', `${SCHEDULER_API}/${this.jobName(name)}`);
    } catch (e) {
      if (this.statusOf(e) !== 404) {
        throw this.describe(e);
      }
    }
  }

  private body(name: string, job: SchedulerJobInput) {
    return {
      name,
      description: `${config.appDetails.name}: ${job.name} (edited in the admin app, not here)`,
      schedule: job.cron,
      timeZone: job.timezone,
      // The whole request may take as long as Cloud Run allows; one retry covers a cold start or a blip, and the
      // claim in ScheduleService makes that retry harmless when the first attempt did run.
      attemptDeadline: `${Math.floor(config.scheduler.requestTimeoutMs / 1000)}s`,
      retryConfig: { retryCount: 1, minBackoffDuration: '60s' },
      httpTarget: {
        uri: `${config.appDetails.domain}/api/internal/jobs/${job.name}`,
        httpMethod: 'POST',
        oidcToken: { serviceAccountEmail: config.scheduler.invokerEmail, audience: config.appDetails.domain },
      },
    };
  }

  private parent(): string {
    return `projects/${config.gcpProjectId}/locations/${config.scheduler.region}`;
  }

  private async request(method: 'POST' | 'PATCH' | 'DELETE', url: string, data?: unknown) {
    if (!this.auth) {
      this.auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    }
    const client = await this.auth.getClient();
    return client.request({ url, method, data });
  }

  private statusOf(e: unknown): number | undefined {
    return (e as { response?: { status?: number } })?.response?.status;
  }

  /** The admin page shows this inline, so it carries Scheduler's own message. */
  private describe(e: unknown): BadGatewayException {
    const error = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
    const message = error?.response?.data?.error?.message || error?.message || 'unknown error';
    return new BadGatewayException(`Cloud Scheduler: ${message}`);
  }
}

export default new CloudSchedulerService();
