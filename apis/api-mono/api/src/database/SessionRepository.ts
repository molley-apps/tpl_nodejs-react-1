import { SessionModel, SessionClass } from '@/database/models/SessionModel';
import { BaseRepository } from '@/database/BaseRepository';

/**
 * Sessions are created by Better Auth on sign in; this repository only reads
 * them for the admin console and deletes them to sign a user out everywhere.
 */
class SessionRepository extends BaseRepository<SessionClass> {
  constructor() {
    super(SessionModel);
  }

  /** Unexpired sessions of a user, newest first, without the token. */
  findActiveByUserId(userId: string) {
    return this.model
      .find({ userId, expiresAt: { $gt: new Date() } })
      .select('-token')
      .sort({ createdAt: -1 })
      .lean();
  }

  deleteByUserId(userId: string) {
    return this.model.deleteMany({ userId });
  }
}

export default new SessionRepository();
