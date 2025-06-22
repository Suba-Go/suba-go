import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { BaseEntity } from '@/common/entities/base.enity';
import { Tenant } from '../tenant/tenant.entity';
import { AuctionItem } from '../auction-item/auction_item.entity';
import { BidDto } from '@suba-go/shared-validation/lib/schemas/bid.schema';

@Entity()
export class Bid extends BaseEntity implements BidDto {
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant: Tenant;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @ManyToOne(() => AuctionItem, { nullable: false })
  auction_item: AuctionItem;

  @Column({ nullable: false }) offered_price: number;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  bid_time: Date;
}
