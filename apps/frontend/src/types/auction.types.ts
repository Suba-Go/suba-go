// Auction-related types for frontend components
import { AuctionStatusEnum } from '@suba-go/shared-validation';
export interface AuctionBid {
  id: string;
  offered_price: number;
  amount: number;
  bid_time: string;
  userId: string;
  user?: {
    id: string;
    public_name?: string;
  };
}

export interface AuctionItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  startingBid: number;
  state: string;
  photos?: string[];
  bids: AuctionBid[];
  item?: {
    id: string;
    brand?: string;
    model?: string;
    plate?: string;
    year?: number;
    photos?: string;
    state?: string;
    soldPrice?: number;
    soldAt?: string;
    soldToUserId?: string;
    soldToUser?: {
      name?: string;
      id: string;
      public_name?: string;
      email?: string;
    };
  };
}

export interface AuctionData {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: AuctionStatusEnum;
  type: string;
  bidIncrement?: number;
  items?: AuctionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuctionListItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: AuctionStatusEnum;
  type: string;
  items?: {
    id: string;
    item: {
      id: string;
      plate?: string;
      brand?: string;
      model?: string;
    };
    bids: Array<{ offered_price: number }>;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface WebSocketBidData {
  auctionItem?: { auction?: { id: string } };
  auction?: { id: string };
  id: string;
  offered_price: number;
  bid_time: string;
  auctionItemId: string;
  user?: {
    id: string;
    public_name?: string;
  };
  item?: {
    id: string;
    name: string;
  };
}

export interface WebSocketAuctionData {
  id: string;
  title: string;
  status: AuctionStatusEnum;
  startTime: string;
  endTime: string;
  description: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date;
  type: string;
}
