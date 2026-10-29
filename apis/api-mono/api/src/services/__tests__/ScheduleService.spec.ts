const mockRepo = {
  findAll: jest.fn(),
  findByName: jest.fn(),
  findDue: jest.fn(),
  upsertFromCode: jest.fn(),
  markOrphaned: jest.fn(),
  updateSchedule: jest.fn(),
  claim: jest.fn(),
  finishRun: jest.fn(),
};
const mockScheduler = { enabled: true, upsert: jest.fn(), remove: jest.fn() };
const mockJob = { name: 'purge-expired-sessions', description: 'Deletes old sessions', defaultSchedule: { cron: '15 3 * * *', timezone: 'UTC' }, run: jest.fn() };

jest.mock('@/database/ScheduledJobRepository', () => ({ __esModule: true, default: mockRepo }));
jest.mock('@/services/CloudSchedulerService', () => ({ __esModule: true, default: mockScheduler }));
jest.mock('@/jobs', () => ({ jobs: [mockJob], jobByName: (name: string) => (name === mockJob.name ? mockJob : undefined) }));

import ScheduleService from '@/services/ScheduleService';
import { BadRequestException, NotFoundException } from '@/http/nodegen/errors';

const record = (overrides: Record<string, unknown> = {}) => ({
  _id: 'purge-expired-sessions',
  description: 'Deletes old sessions',
  defaultCron: '15 3 * * *',
  defaultTimezone: 'UTC',
  cron: '15 3 * * *',
  timezone: 'UTC',
  enabled: false,
  orphaned: false,
  updatedBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockRepo.upsertFromCode.mockResolvedValue(record());
  mockRepo.markOrphaned.mockResolvedValue([]);
  mockRepo.findAll.mockResolvedValue([record()]);
  mockRepo.findByName.mockResolvedValue(record());
  mockRepo.updateSchedule.mockImplementation(async (params) => record({ ...params, _id: params.name }));
  mockRepo.finishRun.mockResolvedValue(record());
  mockScheduler.upsert.mockResolvedValue('projects/p/locations/r/jobs/dev-shop-purge-expired-sessions');
  mockScheduler.remove.mockResolvedValue(undefined);
  mockJob.run.mockResolvedValue({ removed: 3 });
});

describe('ScheduleService.reconcile', () => {
  it('upserts the code\'s jobs, orphans the rest and re-creates Scheduler jobs for enabled records', async () => {
    const orphan = record({ _id: 'old-job', enabled: true, schedulerJobName: 'projects/p/locations/r/jobs/dev-shop-old-job' });
    mockRepo.markOrphaned.mockResolvedValue([orphan]);
    mockRepo.findAll.mockResolvedValue([record({ enabled: true, updatedBy: 'admin-1' }), record({ _id: 'other', enabled: false })]);

    await ScheduleService.reconcile();

    expect(mockRepo.upsertFromCode).toHaveBeenCalledWith({
      name: 'purge-expired-sessions', description: 'Deletes old sessions', defaultCron: '15 3 * * *', defaultTimezone: 'UTC',
    });
    expect(mockRepo.markOrphaned).toHaveBeenCalledWith(['purge-expired-sessions']);
    expect(mockScheduler.remove).toHaveBeenCalledWith('old-job');
    expect(mockScheduler.upsert).toHaveBeenCalledTimes(1);
    expect(mockScheduler.upsert).toHaveBeenCalledWith({ name: 'purge-expired-sessions', cron: '15 3 * * *', timezone: 'UTC' });
    expect(mockRepo.updateSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'purge-expired-sessions', enabled: true, updatedBy: 'admin-1', nextRunAt: expect.any(Date) }),
    );
  });
});

describe('ScheduleService.update', () => {
  it('validates the schedule before touching anything', async () => {
    await expect(ScheduleService.update('purge-expired-sessions', { cron: 'bad', timezone: 'UTC', enabled: true }, 'u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      ScheduleService.update('purge-expired-sessions', { cron: '* * * * *', timezone: 'Nowhere/City', enabled: true }, 'u1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockScheduler.upsert).not.toHaveBeenCalled();
    expect(mockRepo.updateSchedule).not.toHaveBeenCalled();
  });

  it('refuses an unknown or orphaned job', async () => {
    mockRepo.findByName.mockResolvedValueOnce(null);
    await expect(ScheduleService.update('ghost', { cron: '* * * * *', timezone: 'UTC', enabled: true }, 'u1')).rejects.toBeInstanceOf(NotFoundException);
    mockRepo.findByName.mockResolvedValueOnce(record({ orphaned: true }));
    await expect(ScheduleService.update('purge-expired-sessions', { cron: '* * * * *', timezone: 'UTC', enabled: true }, 'u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('enabling creates the Scheduler job and stores its name and the next run', async () => {
    const result = await ScheduleService.update('purge-expired-sessions', { cron: ' */2 * * * * ', timezone: 'Europe/London', enabled: true }, 'admin-1');

    expect(mockScheduler.upsert).toHaveBeenCalledWith({ name: 'purge-expired-sessions', cron: '*/2 * * * *', timezone: 'Europe/London' });
    expect(mockRepo.updateSchedule).toHaveBeenCalledWith({
      name: 'purge-expired-sessions', cron: '*/2 * * * *', timezone: 'Europe/London', enabled: true, updatedBy: 'admin-1',
      nextRunAt: expect.any(Date), schedulerJobName: 'projects/p/locations/r/jobs/dev-shop-purge-expired-sessions',
    });
    expect(result).toMatchObject({ name: 'purge-expired-sessions', enabled: true, running: false });
  });

  it('disabling deletes the Scheduler job that existed and clears the next run', async () => {
    mockRepo.findByName.mockResolvedValue(record({ enabled: true, schedulerJobName: 'projects/p/locations/r/jobs/x' }));

    await ScheduleService.update('purge-expired-sessions', { cron: '15 3 * * *', timezone: 'UTC', enabled: false }, 'admin-1');

    expect(mockScheduler.remove).toHaveBeenCalledWith('purge-expired-sessions');
    expect(mockScheduler.upsert).not.toHaveBeenCalled();
    expect(mockRepo.updateSchedule).toHaveBeenCalledWith(expect.objectContaining({ enabled: false, nextRunAt: undefined, schedulerJobName: undefined }));
  });
});

describe('ScheduleService.runFromScheduler', () => {
  // The caller is verified by InternalAuthService before any route; this method only runs the job.
  it('claims the record, runs the handler and records a success with the next run', async () => {
    mockRepo.claim.mockResolvedValue(record({ enabled: true, running: { startedAt: new Date(), by: 'me' } }));

    const outcome = await ScheduleService.runFromScheduler('purge-expired-sessions');

    expect(mockRepo.claim).toHaveBeenCalledWith(expect.objectContaining({ name: 'purge-expired-sessions', allowDisabled: false, staleBefore: expect.any(Date) }));
    expect(mockJob.run).toHaveBeenCalledWith(expect.objectContaining({ signal: expect.any(AbortSignal), startedAt: expect.any(Date) }));
    expect(mockRepo.finishRun).toHaveBeenCalledWith({
      name: 'purge-expired-sessions',
      lastRun: expect.objectContaining({ status: 'success', by: 'scheduler', result: { removed: 3 }, durationMs: expect.any(Number) }),
      nextRunAt: expect.any(Date),
    });
    expect(outcome).toEqual({ skipped: false, status: 'success', durationMs: expect.any(Number) });
  });

  it('answers skipped when the claim is not won, and runs nothing', async () => {
    mockRepo.claim.mockResolvedValue(null);
    expect(await ScheduleService.runFromScheduler('purge-expired-sessions')).toEqual({ skipped: true });
    expect(mockJob.run).not.toHaveBeenCalled();
    expect(mockRepo.finishRun).not.toHaveBeenCalled();
  });

  it('skips an unknown job without touching the database', async () => {
    expect(await ScheduleService.runFromScheduler('ghost')).toEqual({ skipped: true });
    expect(mockRepo.claim).not.toHaveBeenCalled();
  });

  it('records a thrown handler as failed, still answering 200-shaped data', async () => {
    mockRepo.claim.mockResolvedValue(record({ enabled: true }));
    mockJob.run.mockRejectedValue(new Error('mongo down'));

    const outcome = await ScheduleService.runFromScheduler('purge-expired-sessions');

    expect(outcome).toMatchObject({ skipped: false, status: 'failed' });
    expect(mockRepo.finishRun).toHaveBeenCalledWith(expect.objectContaining({ lastRun: expect.objectContaining({ status: 'failed', error: 'mongo down' }) }));
  });
});

describe('ScheduleService.runNow', () => {
  it('runs a disabled job on request and records who asked', async () => {
    mockRepo.claim.mockResolvedValue(record({ enabled: false }));

    await ScheduleService.runNow('purge-expired-sessions', 'admin-1');

    expect(mockRepo.claim).toHaveBeenCalledWith(expect.objectContaining({ allowDisabled: true }));
    expect(mockRepo.finishRun).toHaveBeenCalledWith(expect.objectContaining({ lastRun: expect.objectContaining({ by: 'admin:admin-1' }), nextRunAt: undefined }));
  });
});

describe('ScheduleService.runDue', () => {
  it('runs each due record through the executor as the local timer', async () => {
    mockRepo.findDue.mockResolvedValue([record({ enabled: true })]);
    mockRepo.claim.mockResolvedValue(record({ enabled: true }));

    await ScheduleService.runDue(new Date());

    expect(mockRepo.finishRun).toHaveBeenCalledWith(expect.objectContaining({ lastRun: expect.objectContaining({ by: 'local-timer' }) }));
  });
});
