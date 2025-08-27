import { Entity, Column, ManyToOne } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { BaseEntity } from '@/common/entities/base.entity';
import { ObservationDto } from '@suba-go/shared-validation/lib/schemas/observation.schema';

@Entity()
export class Observation extends BaseEntity implements ObservationDto {
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column() title: string;
  @Column() description: string;
}
