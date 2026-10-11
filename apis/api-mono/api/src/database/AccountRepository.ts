import { AccountModel, AccountClass } from '@/database/models/AccountModel';
import { BaseRepository } from '@/database/BaseRepository';

/**
 * Accounts (credentials and provider links) are created by Better Auth; the
 * app only removes them together with their user.
 */
class AccountRepository extends BaseRepository<AccountClass> {
  constructor() {
    super(AccountModel);
  }

  deleteByUserId(userId: string) {
    return this.model.deleteMany({ userId });
  }
}

export default new AccountRepository();
