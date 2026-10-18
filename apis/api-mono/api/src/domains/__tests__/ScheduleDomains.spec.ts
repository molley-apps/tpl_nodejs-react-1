const mockSchedule = { list: jest.fn(), update: jest.fn(), runNow: jest.fn(), runFromScheduler: jest.fn() };
jest.mock('@/services/ScheduleService', () => ({ __esModule: true, default: mockSchedule }));
jest.mock('@/services/AdminUserService', () => ({ __esModule: true, default: {} }));

import AdminDomain from '@/domains/AdminDomain';
import AdminNameDomain from '@/domains/AdminNameDomain';
import InternalNameDomain from '@/domains/InternalNameDomain';
import NodegenRequest from '@/http/interfaces/NodegenRequest';

const req = { sessionData: { userId: 'admin-1' }, headers: { authorization: 'Bearer tok' } } as unknown as NodegenRequest;
const schedule = { name: 'purge-expired-sessions', enabled: true };

beforeEach(() => jest.clearAllMocks());

describe('schedule domains', () => {
  it('list, update as the signed-in admin, run now and the Scheduler entry point delegate to ScheduleService', async () => {
    mockSchedule.list.mockResolvedValue([schedule]);
    mockSchedule.update.mockResolvedValue(schedule);
    mockSchedule.runNow.mockResolvedValue(schedule);
    mockSchedule.runFromScheduler.mockResolvedValue({ skipped: false, status: 'success', durationMs: 5 });
    const body = { cron: '* * * * *', timezone: 'UTC', enabled: true };

    expect(await AdminDomain.adminSchedulesGet(req)).toEqual([schedule]);
    expect(await AdminNameDomain.adminSchedulesNamePut(body, { name: 'purge-expired-sessions' }, req)).toEqual(schedule);
    expect(mockSchedule.update).toHaveBeenCalledWith('purge-expired-sessions', body, 'admin-1');
    expect(await AdminNameDomain.adminSchedulesNameRunPost({ name: 'purge-expired-sessions' }, req)).toEqual(schedule);
    expect(mockSchedule.runNow).toHaveBeenCalledWith('purge-expired-sessions', 'admin-1');
    expect(await InternalNameDomain.internalJobsNamePost({ name: 'purge-expired-sessions' }, req)).toEqual({ skipped: false, status: 'success', durationMs: 5 });
    expect(mockSchedule.runFromScheduler).toHaveBeenCalledWith('purge-expired-sessions', 'Bearer tok');
  });
});
