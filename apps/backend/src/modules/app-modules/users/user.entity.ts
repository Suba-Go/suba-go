import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { Company } from '../companies/company.entity';
import { Tenant } from '../tenants/tenant.entity';
import { BaseEntity } from '@/common/entities/base.enity';
import { UserDto } from '@suba-go/shared-validation/lib/schemas/user.schema';
import { UserRolesEnum } from '@suba-go/shared-validation/lib/enums/user';

@Entity()
@Index(['email'], { unique: true, where: '"isDeleted" IS TRUE' })
@Index(['rut'], { unique: true, where: '"isDeleted" IS TRUE' })
export class User extends BaseEntity implements UserDto {
  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
  tenant: Tenant;

  @ManyToOne(() => Company, { nullable: true })
  company: Company;

  @Column({ nullable: true }) name: string;
  @Column({ nullable: false }) email: string;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: false }) password: string;
  @Column({ nullable: true }) rut: string;
  @Column({ nullable: true }) public_name: string;
  @Column({ type: 'enum', enum: UserRolesEnum, default: UserRolesEnum.USER })
  role: UserRolesEnum;
}
