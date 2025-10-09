import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { UserPrismaRepository } from './user-prisma-repository.service';

/**
 * Service responsible for retrieving user information from the database
 */
@Injectable()
export class UserGettersService {
  constructor(private readonly userRepository: UserPrismaRepository) {}

  async getUserWithPasswordByEmail(email: string): Promise<User> {
    return await this.userRepository.findWithPasswordByEmail(email);
  }

  async getUserWithPasswordAndRelationsByEmail(email: string): Promise<User> {
    return await this.userRepository.findByEmailWithRelations(email);
  }

  async getUserById(id: string): Promise<User> {
    return await this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User> {
    return await this.userRepository.findByEmail(email);
  }
}
