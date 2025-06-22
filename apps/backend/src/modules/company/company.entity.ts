import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { BaseEntity } from '@/common/entities/base.enity';
import { CompanyDto } from '@suba-go/shared-validation/lib/schemas/company.schema';

@Entity()
@Index(['name', 'tenant'], { unique: true, where: '"isDeleted" IS FALSE' })
export class Company extends BaseEntity implements CompanyDto {
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column() name: string;
  @Column({ nullable: true }) logo: string;
  @Column({ nullable: true }) principal_color: string;
  @Column({ nullable: true }) principal_color2: string;
  @Column({ nullable: true }) secondary_color: string;
  @Column({ nullable: true }) secondary_color2: string;
  @Column({ nullable: true }) secondary_color3: string;
}
