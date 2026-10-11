import { UserModel, UserClass } from '@/database/models/UserModel';
import { BaseRepository } from '@/database/BaseRepository';

/**
 * Users are created by Better Auth on sign up, this repository reads and updates them.
 */
class UserRepository extends BaseRepository<UserClass> {
  constructor() {
    super(UserModel);
  }

  findById(_id: string) {
    return this.model.findById(_id);
  }

  findByIds(ids: string[]) {
    return this.model.find({ _id: { $in: ids } });
  }

  findByEmail(email: string) {
    return this.model.findOne({ email });
  }

  findAll() {
    return this.model.find().sort({ createdAt: -1 });
  }

  findByRole(role: string) {
    return this.model.find({ roles: role });
  }

  update(input: {
    _id: string;
    updates: Partial<Pick<UserClass, 'firstName' | 'lastName' | 'name' | 'image' | 'roles'>>;
  }) {
    return this.model.findByIdAndUpdate(input._id, input.updates, { new: true });
  }
}

export default new UserRepository();
