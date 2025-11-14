import { z } from 'zod';
import { name } from './main.schema';
import { AuctionStatusEnum, AuctionTypeEnum } from '../enums/auction';
import { baseSchema } from './base.schema';
// import { tenantSchema } from './tenant.schema';
import { auctionItemSchema } from './auction-item.schema';
import { bidSchema } from './bid.schema';
// import { auctionRegistrationSchema } from './auction-registration.schema';

export const auctionSchema = baseSchema
  .extend({
    title: name,
    description: z.string().nullable(),
    startTime: z.date(),
    endTime: z.date(),
    status: z.enum(AuctionStatusEnum).default(AuctionStatusEnum.PENDIENTE),
    type: z.enum(AuctionTypeEnum).default(AuctionTypeEnum.REAL),
    bidIncrement: z.number().positive(),
    tenantId: z.uuid(),
    // Relations
    // get tenant() {
    //   return tenantSchema.nullable();
    // },
    get items() {
      return z.array(auctionItemSchema).nullable();
    },
    get bids() {
      return z.array(bidSchema).nullable();
    },
    // get registeredUsers() {
    //   return z.array(auctionRegistrationSchema).nullable();
    // },
  })
  .strict();

export type AuctionDto = z.infer<typeof auctionSchema>;

export const auctionCreateSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().nullable().optional(),
    startTime: z.date(),
    endTime: z.date(),
    bidIncrement: z.number().positive(),
    type: z.enum(AuctionTypeEnum),
    tenantId: z.uuid(),
    itemIds: z.array(z.uuid()).min(1, 'Debe seleccionar al menos un item'),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'La fecha/hora de termino debe ser posterior al inicio',
    path: ['endTime'],
  });

export type AuctionCreateDto = z.infer<typeof auctionCreateSchema>;
