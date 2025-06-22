import { Entity, Column, ManyToOne } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { BaseEntity } from '@/common/entities/base.enity';
import { ObservationDto } from '@suba-go/shared-validation/lib/schemas/observation.schema';

@Entity()
export class Observation extends BaseEntity implements ObservationDto {
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column() title: string;
  @Column() description: string;
}
