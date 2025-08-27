import { Column } from 'typeorm';
import { Entity, ManyToOne } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { AuditLogActionEnum } from '@suba-go/shared-validation/lib/enums/auction-log';
import { AuditLogDto } from '@suba-go/shared-validation/lib/schemas/audit-log.schema';
import { BaseEntity } from '@/common/entities/base.entity';

@Entity()
export class AuditLog extends BaseEntity implements AuditLogDto {
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant: Tenant;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ nullable: false }) entity: string;
  @Column({ nullable: false }) entity_id: string;
  @Column({
    type: 'enum',
    enum: AuditLogActionEnum,
    default: AuditLogActionEnum.CREATE,
    nullable: false,
  })
  action: AuditLogActionEnum;
  @Column('json') changes: Record<string, unknown>;
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  timestamp: Date;

  @Column({ nullable: false }) auction_id: string;
  @Column({ nullable: false }) auction_item_id: string;
  @Column({ nullable: false }) observation_id: string;
  @Column({ nullable: false }) bid_id: string;
}
