import { AppSecretClass, AppSecretModel } from '@/database/models/AppSecretModel';
import { BaseRepository } from '@/database/BaseRepository';

export type AppSecretWrite = Omit<AppSecretClass, 'createdAt' | 'updatedAt'>;

/** The appSecrets collection, see AppSecretModel. */
class AppSecretRepository extends BaseRepository<AppSecretClass> {
  constructor() {
    super(AppSecretModel);
  }

  list() {
    return this.model.find().sort({ _id: 1 }).lean();
  }

  fetch(key: string) {
    return this.model.findById(key).lean();
  }

  /** Creates or replaces the secret under its name. */
  save(secret: AppSecretWrite) {
    const { _id, ...fields } = secret;
    return this.model.findByIdAndUpdate(_id, { $set: fields }, { upsert: true, returnDocument: 'after' }).lean();
  }

  remove(key: string) {
    return this.model.deleteOne({ _id: key });
  }
}

export default new AppSecretRepository();
