import { BaseEntity } from '@/common/entities/base.enity';
import { Entity, Column } from 'typeorm';
import { TenantDto } from '@suba-go/shared-validation/lib/schemas/tenant.schema';

@Entity()
export class Tenant extends BaseEntity implements TenantDto {
  @Column({ nullable: false }) name: string;

  @Column({ unique: true, nullable: false }) domain: string;
}
