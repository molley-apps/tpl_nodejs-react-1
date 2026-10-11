import UserRepository, { UserSearch } from '@/database/UserRepository';
import SessionRepository from '@/database/SessionRepository';
import AccountRepository from '@/database/AccountRepository';
import { UserClass } from '@/database/models/UserModel';
import { SessionClass } from '@/database/models/SessionModel';
import { ForbiddenException, NotFoundException } from '@/http/nodegen/errors';
import { SYSTEM_SUPER_ADMIN } from '@/constants/ROLES';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * What a system admin may do to other users. Accounts are created by sign up
 * (Better Auth), so there is no create here: list, grant system roles, see and
 * revoke sessions, delete.
 *
 * Two guards keep an admin from locking everyone out: they cannot remove
 * their own SUPER_ADMIN role and cannot delete their own account.
 */
class AdminUserService {
  list(query: Partial<UserSearch>) {
    const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(Number(query.offset) || 0, 0);
    return UserRepository.search({ offset, limit, search: query.search, role: query.role }).then(({ data, total }) => ({
      data,
      meta: { offset, limit, totalResultCount: total },
    }));
  }

  async setRoles(input: { actorId: string; userId: string; roles: string[] }): Promise<UserClass> {
    if (input.actorId === input.userId && !input.roles.includes(SYSTEM_SUPER_ADMIN)) {
      throw new ForbiddenException('You cannot remove your own SUPER_ADMIN role');
    }
    const user = await UserRepository.update({ _id: input.userId, updates: { roles: input.roles } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async sessionsFor(userId: string): Promise<Omit<SessionClass, 'token'>[]> {
    await this.requireUser(userId);
    return SessionRepository.findActiveByUserId(userId);
  }

  async signOutEverywhere(userId: string): Promise<void> {
    await this.requireUser(userId);
    await SessionRepository.deleteByUserId(userId);
  }

  /** Removes the user, their credentials and every session. */
  async deleteUser(input: { actorId: string; userId: string }): Promise<void> {
    if (input.actorId === input.userId) {
      throw new ForbiddenException('You cannot delete your own account from the admin console');
    }
    await this.requireUser(input.userId);
    await Promise.all([SessionRepository.deleteByUserId(input.userId), AccountRepository.deleteByUserId(input.userId)]);
    await UserRepository.deleteById(input.userId);
  }

  private async requireUser(userId: string): Promise<UserClass> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

export default new AdminUserService();
