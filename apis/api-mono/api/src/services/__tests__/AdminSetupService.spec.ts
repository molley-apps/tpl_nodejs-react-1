const mockUsers = { existsWithRole: jest.fn(), update: jest.fn() };
jest.mock('@/database/UserRepository', () => ({ __esModule: true, default: mockUsers }));

import config from '@/config';
import AdminSetupService from '@/services/AdminSetupService';
import { ConflictException, ForbiddenException, NotFoundException } from '@/http/nodegen/errors';

const KEY = 'k3y-that-is-long-enough-to-be-a-setup-key';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  config.auth.adminSetupKey = KEY;
  mockUsers.existsWithRole.mockResolvedValue(false);
  mockUsers.update.mockResolvedValue({ _id: 'u1', email: 'ada@acme.com', roles: ['SUPER_ADMIN'] });
});

describe('AdminSetupService.claim', () => {
  it('makes the signed-in user SUPER_ADMIN when the key matches and nobody holds the role yet', async () => {
    const user = await AdminSetupService.claim({ userId: 'u1', key: ` ${KEY} ` });
    expect(mockUsers.update).toHaveBeenCalledWith({ _id: 'u1', updates: { roles: ['SUPER_ADMIN'] } });
    expect(user.roles).toEqual(['SUPER_ADMIN']);
  });

  it('refuses a wrong key before looking at the users, and a claim once an administrator exists', async () => {
    await expect(AdminSetupService.claim({ userId: 'u1', key: 'nope' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockUsers.existsWithRole).not.toHaveBeenCalled();

    mockUsers.existsWithRole.mockResolvedValue(true);
    await expect(AdminSetupService.claim({ userId: 'u1', key: KEY })).rejects.toBeInstanceOf(ConflictException);
    expect(mockUsers.update).not.toHaveBeenCalled();
  });

  it('is unavailable when the environment has no setup key', async () => {
    config.auth.adminSetupKey = '';
    await expect(AdminSetupService.claim({ userId: 'u1', key: KEY })).rejects.toBeInstanceOf(NotFoundException);
  });
});
