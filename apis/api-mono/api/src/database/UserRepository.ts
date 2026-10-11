import { UserModel, UserClass } from '@/database/models/UserModel';
import { BaseRepository } from '@/database/BaseRepository';
import { escapeRegExp } from '@/utils/escapeRegExp';

export interface UserSearch {
  offset: number;
  limit: number;
  /** Matches email, name, first name or last name, case-insensitively */
  search?: string;
  /** Only users holding this system role */
  role?: string;
}

/**
 * Users are created by Better Auth on sign up, this repository reads, updates and removes them.
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

  /** A page of users, newest first, plus the total matching the filters. */
  async search(input: UserSearch): Promise<{ data: UserClass[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (input.search) {
      const term = new RegExp(escapeRegExp(input.search.trim()), 'i');
      filter.$or = [{ email: term }, { name: term }, { firstName: term }, { lastName: term }];
    }
    if (input.role) {
      filter.roles = input.role;
    }
    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(input.offset).limit(input.limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total };
  }

  update(input: {
    _id: string;
    updates: Partial<Pick<UserClass, 'firstName' | 'lastName' | 'name' | 'image' | 'roles'>>;
  }) {
    return this.model.findByIdAndUpdate(input._id, input.updates, { returnDocument: 'after' });
  }

  deleteById(_id: string) {
    return this.model.deleteOne({ _id });
  }
}

export default new UserRepository();
