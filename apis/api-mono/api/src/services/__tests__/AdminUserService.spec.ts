const mockUsers = {
  search: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  deleteById: jest.fn(),
};
const mockSessions = { findActiveByUserId: jest.fn(), deleteByUserId: jest.fn() };
const mockAccounts = { deleteByUserId: jest.fn() };

jest.mock('@/database/UserRepository', () => ({ __esModule: true, default: mockUsers }));
jest.mock('@/database/SessionRepository', () => ({ __esModule: true, default: mockSessions }));
jest.mock('@/database/AccountRepository', () => ({ __esModule: true, default: mockAccounts }));

import AdminUserService from '@/services/AdminUserService';
import { ForbiddenException, NotFoundException } from '@/http/nodegen/errors';

const admin = 'admin-1';
const other = 'user-2';

beforeEach(() => {
  jest.clearAllMocks();
  mockUsers.findById.mockResolvedValue({ _id: other });
  mockUsers.update.mockResolvedValue({ _id: other, roles: [] });
  mockUsers.search.mockResolvedValue({ data: [], total: 0 });
  mockSessions.findActiveByUserId.mockResolvedValue([]);
});

describe('AdminUserService.list', () => {
  it('pages with sane defaults and reports the total', async () => {
    mockUsers.search.mockResolvedValue({ data: [{ _id: 'a' }], total: 41 });

    const result = await AdminUserService.list({});

    expect(mockUsers.search).toHaveBeenCalledWith({ offset: 0, limit: 25, search: undefined, role: undefined });
    expect(result.meta).toEqual({ offset: 0, limit: 25, totalResultCount: 41 });
    expect(result.data).toHaveLength(1);
  });

  it('caps the page size and passes the filters through', async () => {
    await AdminUserService.list({ offset: 50, limit: 5000, search: 'ada', role: 'SUPER_ADMIN' });

    expect(mockUsers.search).toHaveBeenCalledWith({ offset: 50, limit: 100, search: 'ada', role: 'SUPER_ADMIN' });
  });
});

describe('AdminUserService.setRoles', () => {
  it('replaces the roles of another user', async () => {
    await AdminUserService.setRoles({ actorId: admin, userId: other, roles: ['SUPER_ADMIN'] });

    expect(mockUsers.update).toHaveBeenCalledWith({ _id: other, updates: { roles: ['SUPER_ADMIN'] } });
  });

  it('lets an admin keep their own SUPER_ADMIN role', async () => {
    await expect(
      AdminUserService.setRoles({ actorId: admin, userId: admin, roles: ['SUPER_ADMIN'] }),
    ).resolves.toBeDefined();
  });

  it('refuses to strip the acting admin of SUPER_ADMIN', async () => {
    await expect(AdminUserService.setRoles({ actorId: admin, userId: admin, roles: [] })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mockUsers.update).not.toHaveBeenCalled();
  });

  it('404s an unknown user', async () => {
    mockUsers.update.mockResolvedValue(null);

    await expect(AdminUserService.setRoles({ actorId: admin, userId: 'ghost', roles: [] })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('AdminUserService sessions', () => {
  it('lists active sessions of an existing user', async () => {
    mockSessions.findActiveByUserId.mockResolvedValue([{ _id: 's1' }]);

    await expect(AdminUserService.sessionsFor(other)).resolves.toEqual([{ _id: 's1' }]);
  });

  it('signs a user out everywhere', async () => {
    await AdminUserService.signOutEverywhere(other);

    expect(mockSessions.deleteByUserId).toHaveBeenCalledWith(other);
  });

  it('404s before touching sessions of an unknown user', async () => {
    mockUsers.findById.mockResolvedValue(null);

    await expect(AdminUserService.signOutEverywhere('ghost')).rejects.toBeInstanceOf(NotFoundException);
    expect(mockSessions.deleteByUserId).not.toHaveBeenCalled();
  });
});

describe('AdminUserService.deleteUser', () => {
  it('removes sessions, accounts and then the user', async () => {
    await AdminUserService.deleteUser({ actorId: admin, userId: other });

    expect(mockSessions.deleteByUserId).toHaveBeenCalledWith(other);
    expect(mockAccounts.deleteByUserId).toHaveBeenCalledWith(other);
    expect(mockUsers.deleteById).toHaveBeenCalledWith(other);
  });

  it('refuses to delete the acting admin', async () => {
    await expect(AdminUserService.deleteUser({ actorId: admin, userId: admin })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mockUsers.deleteById).not.toHaveBeenCalled();
  });

  it('404s an unknown user without deleting anything', async () => {
    mockUsers.findById.mockResolvedValue(null);

    await expect(AdminUserService.deleteUser({ actorId: admin, userId: 'ghost' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mockUsers.deleteById).not.toHaveBeenCalled();
  });
});
