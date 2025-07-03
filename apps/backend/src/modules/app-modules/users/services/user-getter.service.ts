import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';
import { User } from '@/modules/app-modules/users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Service responsible for retrieving user information from the database
 */
@Injectable()
export class UserGettersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async getUserWithPasswordByEmail(email: string): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .leftJoinAndSelect('user.company', 'company')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    return user;
  }

  async getUserById(id: string): Promise<User> {
    return await this.usersRepository.findOne({ where: { id: Equal(id) } });
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }
}
