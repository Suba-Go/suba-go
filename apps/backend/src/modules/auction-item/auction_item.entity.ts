import { Entity, Column, ManyToOne } from 'typeorm';
import { Auction } from '../auction/auction.entity';
import { Item } from '../item/item.entity';
import { Tenant } from '../tenant/tenant.entity';
import { AuctionItemStateEnum } from '@suba-go/shared-validation/lib/enums/auction-item';
import { BaseEntity } from '@/common/entities/base.enity';
import { AuctionItemDto } from '@suba-go/shared-validation/lib/schemas/auction-item.schema';

@Entity()
export class AuctionItem extends BaseEntity implements AuctionItemDto {
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant: Tenant;

  @ManyToOne(() => Auction, { nullable: false })
  auction: Auction;

  @ManyToOne(() => Item, { nullable: false })
  item: Item;

  @Column() name: string;
  @Column({
    type: 'enum',
    enum: AuctionItemStateEnum,
    default: AuctionItemStateEnum.DISPONIBLE,
  })
  state: AuctionItemStateEnum;
  @Column() start_price: number;
  @Column() actual_price: number;
  @Column({ nullable: true }) selled_price: number;
  @Column({ nullable: true }) selled_date: Date;
}
