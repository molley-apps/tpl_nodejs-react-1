import { timingSafeEqual } from 'crypto';
import config from '@/config';
import UserRepository from '@/database/UserRepository';
import { UserClass } from '@/database/models/UserModel';
import { ConflictException, ForbiddenException, NotFoundException } from '@/http/nodegen/errors';
import { SYSTEM_SUPER_ADMIN } from '@/constants/ROLES';

/**
 * The first administrator of an environment. Nobody can reach the admin app until one user holds SUPER_ADMIN, and the
 * owner has no database access, so the deploy generates a one-time setup key (ADMIN_SETUP_KEY) that Molley hands to
 * them. Whoever is signed in and presents it becomes the administrator. The key is dead the moment an administrator
 * exists, so it cannot be reused, and a wrong key never reveals whether a claim is still possible.
 */
class AdminSetupService {
  async claim(input: { userId: string; key: string }): Promise<UserClass> {
    const expected = config.auth.adminSetupKey;
    if (!expected) {
      throw new NotFoundException('Administrator setup is not available in this environment');
    }
    if (!this.matches(input.key, expected)) {
      throw new ForbiddenException('That setup key is not valid for this environment');
    }
    if (await UserRepository.existsWithRole(SYSTEM_SUPER_ADMIN)) {
      throw new ConflictException('This environment already has an administrator; ask them to grant you a system role');
    }
    const user = await UserRepository.update({ _id: input.userId, updates: { roles: [SYSTEM_SUPER_ADMIN] } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    console.log(`AdminSetupService: ${user.email} claimed the administrator role with the setup key`);
    return user;
  }

  private matches(presented: string, expected: string): boolean {
    const a = Buffer.from(presented.trim());
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}

export default new AdminSetupService();
