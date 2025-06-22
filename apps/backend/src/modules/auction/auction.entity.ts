import { Entity, Column, ManyToOne } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { BaseEntity } from '@/common/entities/base.enity';
import {
  AuctionStateEnum,
  AuctionTypeEnum,
} from '@suba-go/shared-validation/lib/enums/auction';
import { AuctionDto } from '@suba-go/shared-validation/lib/schemas/auction.schema';

@Entity()
export class Auction extends BaseEntity implements AuctionDto {
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column() public_id: string;
  @Column() name: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  start: Date;
  @Column({ type: 'timestamp', default: null }) end: Date;
  @Column({
    type: 'enum',
    enum: AuctionStateEnum,
    default: AuctionStateEnum.ACTIVE,
  })
  state: AuctionStateEnum;
  @Column({
    type: 'enum',
    enum: AuctionTypeEnum,
    default: AuctionTypeEnum.REAL,
  })
  type: AuctionTypeEnum;
}
