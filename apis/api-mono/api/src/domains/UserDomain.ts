import { User, UserCurrentPutPut } from '@/http/nodegen/interfaces';

import { UserDomainInterface } from '@/http/nodegen/domainInterfaces/UserDomainInterface';

import UserRepository from '@/database/UserRepository';
import { NotFoundException } from '@/http/nodegen/errors';

class UserDomain implements UserDomainInterface {
  public async userCurrentGet(req: any): Promise<User> {
    const user = await UserRepository.findById(req.sessionData.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  public async userCurrentPut(body: UserCurrentPutPut, req: any): Promise<User> {
    const user = await UserRepository.update({
      _id: req.sessionData.userId,
      updates: body,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

export default new UserDomain();
