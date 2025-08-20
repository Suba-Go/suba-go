import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Equal } from 'typeorm';
import { User } from '../user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return await this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id: Equal(id) },
      relations: ['tenant', 'company'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email: Equal(email) },
    });
  }

  async findByEmailWithRelations(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email: Equal(email) },
      relations: ['tenant', 'company', 'company.tenant'],
    });
  }

  async findByRut(rut: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { rut },
      relations: ['tenant', 'company'],
    });
  }

  async findWithPasswordByEmail(email: string): Promise<User | null> {
    return await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .leftJoinAndSelect('user.company', 'company')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    return await this.usersRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['tenant', 'company'],
    });
  }

  async findByCompany(companyId: string): Promise<User[]> {
    return await this.usersRepository.find({
      where: { company: { id: companyId } },
      relations: ['tenant', 'company'],
    });
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      relations: ['tenant', 'company'],
    });
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, updateData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.usersRepository.delete(id);
    return result.affected > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.usersRepository.update(id, { isDeleted: true });
    return result.affected > 0;
  }

  async connectUserToCompanyAndTenant(
    id: string,
    tenantId: string,
    companyId: string
  ) {
    return await this.usersRepository.update(id, {
      tenant: { id: tenantId },
      company: { id: companyId },
    });
  }
}
