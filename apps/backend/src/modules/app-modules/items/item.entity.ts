import { Entity, Column, ManyToOne } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import {
  ItemStateEnum,
  LegalStatusEnum,
} from '@suba-go/shared-validation/lib/enums/item';
import { BaseEntity } from '@/common/entities/base.entity';
import { ItemDto } from '@suba-go/shared-validation/lib/schemas/item.schema';

@Entity()
export class Item extends BaseEntity implements ItemDto {
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ nullable: true }) plate: string;
  @Column({ nullable: true }) brand: string;
  @Column({ nullable: true }) model: string;
  @Column({ nullable: true }) year: number;
  @Column({ nullable: true }) version: string;
  @Column({ nullable: true }) photos: string; // revisar
  @Column({ nullable: true }) docs: string; // revisar
  @Column({ nullable: true }) kilometraje: number;
  @Column({ nullable: true }) legal_status: LegalStatusEnum;
  @Column({ default: ItemStateEnum.DISPONIBLE }) state: ItemStateEnum;
}
