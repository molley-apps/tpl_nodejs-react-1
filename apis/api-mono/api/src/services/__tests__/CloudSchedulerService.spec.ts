const mockRequest = jest.fn();
jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn(() => ({ getClient: async () => ({ request: mockRequest }) })),
}));

import config from '@/config';
import CloudSchedulerService from '@/services/CloudSchedulerService';
import { BadGatewayException } from '@/http/nodegen/errors';

const job = { name: 'purge-expired-sessions', cron: '15 3 * * *', timezone: 'UTC' };
const fail = (status: number, message: string) => Object.assign(new Error(message), { response: { status, data: { error: { message } } } });

beforeEach(() => {
  jest.clearAllMocks();
  config.scheduler.enabled = true;
  config.scheduler.invokerEmail = 'dev-shop-sched@p.iam.gserviceaccount.com';
  config.scheduler.jobPrefix = 'dev-shop';
  config.scheduler.region = 'europe-west2';
  config.gcpProjectId = 'molley-apps-dev-01';
  config.appDetails.domain = 'https://shop-dev.molley.site';
});

describe('CloudSchedulerService', () => {
  it('does nothing while Cloud Scheduler is not configured', async () => {
    config.scheduler.enabled = false;
    expect(await CloudSchedulerService.upsert(job)).toBeUndefined();
    await CloudSchedulerService.remove(job.name);
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('creates the job with the OIDC target, the deadline and one retry', async () => {
    mockRequest.mockResolvedValue({});

    const name = await CloudSchedulerService.upsert(job);

    expect(name).toBe('projects/molley-apps-dev-01/locations/europe-west2/jobs/dev-shop-purge-expired-sessions');
    expect(mockRequest).toHaveBeenCalledTimes(1);
    const call = mockRequest.mock.calls[0][0];
    expect(call.method).toBe('POST');
    expect(call.url).toBe('https://cloudscheduler.googleapis.com/v1/projects/molley-apps-dev-01/locations/europe-west2/jobs');
    expect(call.data).toMatchObject({
      name,
      schedule: '15 3 * * *',
      timeZone: 'UTC',
      attemptDeadline: '300s',
      retryConfig: { retryCount: 1, minBackoffDuration: '60s' },
      httpTarget: {
        uri: 'https://shop-dev.molley.site/api/internal/jobs/purge-expired-sessions',
        httpMethod: 'POST',
        oidcToken: { serviceAccountEmail: 'dev-shop-sched@p.iam.gserviceaccount.com', audience: 'https://shop-dev.molley.site' },
      },
    });
  });

  it('patches the job when it already exists', async () => {
    mockRequest.mockRejectedValueOnce(fail(409, 'already exists')).mockResolvedValueOnce({});

    await CloudSchedulerService.upsert({ ...job, cron: '*/2 * * * *' });

    const patch = mockRequest.mock.calls[1][0];
    expect(patch.method).toBe('PATCH');
    expect(patch.url).toMatch(/jobs\/dev-shop-purge-expired-sessions\?updateMask=schedule,timeZone,attemptDeadline,retryConfig,httpTarget$/);
    expect(patch.data.schedule).toBe('*/2 * * * *');
  });

  it('surfaces other Scheduler errors with their message', async () => {
    mockRequest.mockRejectedValue(fail(403, 'Permission denied on resource project'));
    await expect(CloudSchedulerService.upsert(job)).rejects.toThrow(BadGatewayException);
    await expect(CloudSchedulerService.upsert(job)).rejects.toMatchObject({ body: 'Cloud Scheduler: Permission denied on resource project' });
  });

  it('deletes the job and ignores one that is already gone', async () => {
    mockRequest.mockResolvedValueOnce({});
    await CloudSchedulerService.remove(job.name);
    expect(mockRequest.mock.calls[0][0]).toMatchObject({ method: 'DELETE', url: expect.stringMatching(/dev-shop-purge-expired-sessions$/) });

    mockRequest.mockRejectedValueOnce(fail(404, 'not found'));
    await expect(CloudSchedulerService.remove(job.name)).resolves.toBeUndefined();

    mockRequest.mockRejectedValueOnce(fail(500, 'boom'));
    await expect(CloudSchedulerService.remove(job.name)).rejects.toThrow(BadGatewayException);
  });
});
