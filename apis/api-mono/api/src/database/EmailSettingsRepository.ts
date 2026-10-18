import { EmailSettingsModel, EmailSettingsClass, EMAIL_SETTINGS_ID } from '@/database/models/EmailSettingsModel';
import { BaseRepository } from '@/database/BaseRepository';

/** Everything the admin saves; the timestamps and verification state are managed here. */
export type EmailSettingsWrite = Omit<
  EmailSettingsClass,
  '_id' | 'verifiedAt' | 'lastSendAt' | 'lastError' | 'createdAt' | 'updatedAt'
>;

/**
 * The single `email` document of the appSettings collection, see EmailSettingsModel.
 */
class EmailSettingsRepository extends BaseRepository<EmailSettingsClass> {
  constructor() {
    super(EmailSettingsModel);
  }

  fetch() {
    return this.model.findById(EMAIL_SETTINGS_ID).lean();
  }

  /** Creates or replaces the settings. Any save needs a new test send, so the verification state is cleared. */
  save(settings: EmailSettingsWrite) {
    return this.model
      .findByIdAndUpdate(
        EMAIL_SETTINGS_ID,
        { $set: settings, $unset: { verifiedAt: 1, lastSendAt: 1, lastError: 1 } },
        { upsert: true, returnDocument: 'after' },
      )
      .lean();
  }

  markVerified(at: Date) {
    return this.model.updateOne(
      { _id: EMAIL_SETTINGS_ID },
      { $set: { verifiedAt: at, lastSendAt: at }, $unset: { lastError: 1 } },
    );
  }

  recordSendSuccess(at: Date) {
    return this.model.updateOne({ _id: EMAIL_SETTINGS_ID }, { $set: { lastSendAt: at }, $unset: { lastError: 1 } });
  }

  recordSendFailure(error: string) {
    return this.model.updateOne({ _id: EMAIL_SETTINGS_ID }, { $set: { lastError: error } });
  }

  remove() {
    return this.model.deleteOne({ _id: EMAIL_SETTINGS_ID });
  }
}

export default new EmailSettingsRepository();
