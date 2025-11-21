/**
 * @file auction-active-bidding-view-refactored.tsx
 * @description Refactored USER view for active auctions with real-time bidding
 * @author Suba&Go
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  AlertDescription,
} from '@suba-go/shared-components/components/ui/alert';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { AlertCircle } from 'lucide-react';
import { CountdownTimer } from '../countdown-timer';
import { AuctionItemDetailModal } from '../auction-item-detail-modal';
import { AuctionHeader } from './auction-header';
// import { ConnectionStatus } from './connection-status';
import { AuctionItemCard } from './auction-item-card';
import { SelfBidWarningDialog, AutoBidConfirmDialog } from './bidding-dialogs';
import { useAuctionWebSocketBidding } from '@/hooks/use-auction-websocket-bidding';
import { useAutoBidSettings } from '@/hooks/use-auto-bid-settings';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
} from '@suba-go/shared-validation';

interface AuctionActiveBiddingViewProps {
  auction: AuctionDto;
  accessToken: string;
  tenantId: string;
  userId: string;
  auctionItems: AuctionItemWithItmeAndBidsDto[];
  onRealtimeSnapshot?: () => void;
}

interface BidState {
  [auctionItemId: string]: {
    amount: string;
    isPending: boolean;
    error: string | null;
  };
}

interface ItemBidHistory {
  [auctionItemId: string]: Array<{
    id: string;
    amount: number;
    userId: string;
    userName: string;
    timestamp: number;
  }>;
}

export function AuctionActiveBiddingView({
  auction,
  auctionItems,
  accessToken,
  tenantId,
  userId,
  onRealtimeSnapshot,
}: AuctionActiveBiddingViewProps) {
  const [bidStates, setBidStates] = useState<BidState>({});
  const [bidHistory, setBidHistory] = useState<ItemBidHistory>({});
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemWithItmeAndBidsDto | null>(null);
  const [selfBidWarning, setSelfBidWarning] = useState<{
    auctionItemId: string;
    amount: number;
  } | null>(null);
  const [pendingAutoBid, setPendingAutoBid] = useState<{
    auctionItemId: string;
    maxPrice: number;
  } | null>(null);

  // Custom hooks
  const { autoBidSettings, updateAutoBidSetting, removeAutoBidSetting } =
    useAutoBidSettings(auction.id);
  const { toast } = useToast();
  const getHighestFromApi = (ai: AuctionItemWithItmeAndBidsDto) => {
    const highestApiBid =
      ai.bids && ai.bids.length > 0
        ? Math.max(...ai.bids.map((b) => Number(b.offered_price || 0)))
        : 0;
    return Math.max(highestApiBid, Number(ai.startingBid || 0));
  };

  const getHighestBidderFromApi = (ai: AuctionItemWithItmeAndBidsDto) => {
    if (!ai.bids || ai.bids.length === 0) return undefined;
    // toma la puja más alta
    const sorted = [...ai.bids].sort(
      (a, b) => Number(b.offered_price || 0) - Number(a.offered_price || 0)
    );
    return sorted[0]?.userId;
  };

  // WebSocket handlers
  const handleBidPlaced = useCallback(
    (data: any) => {
      const {
        auctionItemId,
        amount,
        userId: bidderId,
        userName,
        bidId,
        timestamp,
      } = data;

      setBidHistory((prev) => {
        const current = prev[auctionItemId] || [];
        const incoming = {
          id: bidId,
          amount,
          userId: bidderId,
          userName: userName || 'Usuario',
          timestamp,
        };
        const merged = [incoming, ...current].reduce((acc, bid) => {
          if (!acc.find((x) => x.id === bid.id)) acc.push(bid);
          return acc;
        }, [] as typeof current);
        merged.sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);
        return {
          ...prev,
          [auctionItemId]: merged.slice(0, 10),
        };
      });

      setBidStates((prev) => ({
        ...prev,
        [auctionItemId]: {
          ...prev[auctionItemId],
          isPending: false,
          error: null,
          amount: (amount + Number(auction.bidIncrement || 50000)).toString(),
        },
      }));

      // Toast de éxito solo para la puja del usuario actual
      if (bidderId === userId) {
        toast({
          description:
            'Tu puja se realizó con éxito, estás ganando hasta el momento.',
          duration: 1300,
        });
      }
    },
    [userId, auction.bidIncrement, toast]
  );

  const handleBidRejected = useCallback((data: any) => {
    const { auctionItemId, reason } = data;
    setBidStates((prev) => ({
      ...prev,
      [auctionItemId]: {
        ...prev[auctionItemId],
        isPending: false,
        error: reason || 'Puja rechazada',
      },
    }));
  }, []);

  useEffect(() => {
    if (!auctionItems) return;
    setBidHistory((prev) => {
      const next: ItemBidHistory = { ...prev };
      auctionItems.forEach((ai) => {
        const fromApi =
          (ai.bids || [])
            .map((b) => ({
              id: b.id,
              amount: Number(b.offered_price),
              userId: b.userId,
              userName: b.user?.public_name || 'Usuario',
              timestamp: new Date(
                b.bid_time || b.createdAt || Date.now()
              ).getTime(),
            }))
            .sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp) ||
          [];
        const existing = prev[ai.id] || [];
        const merged = [...fromApi, ...existing].reduce((acc, bid) => {
          if (!acc.find((x) => x.id === bid.id)) acc.push(bid);
          return acc;
        }, [] as typeof fromApi);
        merged.sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);
        next[ai.id] = merged;
      });
      return next;
    });
  }, [auctionItems]);

  const handleTimeExtension = useCallback((data: any) => {
    // TODO: extend auction time
  }, []);

  const { isJoined, connectionError, sendBid } = useAuctionWebSocketBidding({
    auctionId: auction.id,
    tenantId,
    accessToken,
    onBidPlaced: handleBidPlaced,
    onBidRejected: handleBidRejected,
    onTimeExtension: handleTimeExtension,
    onJoined: onRealtimeSnapshot,
  });

  // Initialize bid states
  // Rehidrata historial con lo que viene del API
  // Inicializa montos mínimos para cada item cuando llega data
  useEffect(() => {
    if (!auctionItems) return;
    setBidStates((prev) => {
      const next: BidState = { ...prev };
      auctionItems.forEach((ai) => {
        const historyHighest = bidHistory[ai.id]?.[0]?.amount;
        const apiHighest = getHighestFromApi(ai);
        const currentHighest =
          historyHighest !== undefined ? historyHighest : apiHighest;
        const bidIncrement = Number(auction.bidIncrement || 50000);
        const minNextBid = currentHighest + bidIncrement;
        if (!next[ai.id]) {
          next[ai.id] = {
            amount: minNextBid.toString(),
            isPending: false,
            error: null,
          };
        }
      });
      return next;
    });
  }, [auctionItems, bidHistory, auction.bidIncrement]);

  // Ensure suggested amount is refreshed from latest data (non-optimistic)
  useEffect(() => {
    if (!auctionItems) return;
    setBidStates((prev) => {
      const next: BidState = { ...prev };
      auctionItems.forEach((ai) => {
        const historyHighest = bidHistory[ai.id]?.[0]?.amount;
        const apiHighest = getHighestFromApi(ai);
        const currentHighest =
          historyHighest !== undefined ? historyHighest : apiHighest;
        const bidIncrement = Number(auction.bidIncrement || 50000);
        const minNextBid = currentHighest + bidIncrement;

        const prevAmount = next[ai.id]?.amount
          ? Number(next[ai.id].amount)
          : undefined;
        const shouldUpdateAmount =
          prevAmount === undefined ||
          (!next[ai.id]?.isPending && prevAmount < minNextBid);

        next[ai.id] = {
          amount: shouldUpdateAmount
            ? minNextBid.toString()
            : next[ai.id]?.amount || minNextBid.toString(),
          isPending: next[ai.id]?.isPending || false,
          error: next[ai.id]?.error || null,
        };
      });
      return next;
    });
  }, [auctionItems, bidHistory, auction.bidIncrement]);

  // Place bid function
  const placeBid = (auctionItemId: string, skipSelfBidCheck = false) => {
    const bidState = bidStates[auctionItemId];
    if (!bidState || bidState.isPending) return;

    const amount = Number(bidState.amount);
    const itemHistory = bidHistory[auctionItemId] || [];
    const currentHighestBidderId =
      itemHistory[0]?.userId ||
      getHighestBidderFromApi(
        auctionItems.find(
          (i) => i.id === auctionItemId
        ) as AuctionItemWithItmeAndBidsDto
      );

    if (!skipSelfBidCheck && currentHighestBidderId === userId) {
      setSelfBidWarning({ auctionItemId, amount });
      return;
    }

    setBidStates((prev) => ({
      ...prev,
      [auctionItemId]: { ...prev[auctionItemId], isPending: true, error: null },
    }));

    sendBid(auctionItemId, amount);
  };

  const confirmSelfBid = () => {
    if (selfBidWarning) {
      placeBid(selfBidWarning.auctionItemId, true);
      setSelfBidWarning(null);
    }
  };

  const updateBidAmount = (auctionItemId: string, value: string) => {
    setBidStates((prev) => ({
      ...prev,
      [auctionItemId]: {
        ...prev[auctionItemId],
        amount: value,
        error: null,
      },
    }));
  };

  const handleAutoBidToggle = (auctionItemId: string) => {
    const currentSetting = autoBidSettings[auctionItemId];
    if (currentSetting?.enabled) {
      removeAutoBidSetting(auctionItemId);
    } else {
      const itemHistory = bidHistory[auctionItemId] || [];
      const currentHighest = Number(
        itemHistory[0]?.amount ||
          auctionItems?.find((i) => i.id === auctionItemId)?.bids?.[0]
            ?.offered_price ||
          auctionItems?.find((i) => i.id === auctionItemId)?.startingBid ||
          0
      );
      const bidIncrement = Number(auction.bidIncrement || 50000);
      const minNextBid = currentHighest + bidIncrement;

      setPendingAutoBid({ auctionItemId, maxPrice: minNextBid * 2 });
    }
  };

  const confirmAutoBid = () => {
    if (pendingAutoBid) {
      updateAutoBidSetting(pendingAutoBid.auctionItemId, {
        enabled: true,
        maxPrice: pendingAutoBid.maxPrice,
      });
      setPendingAutoBid(null);
    }
  };

  const handleAutoBidMaxPriceChange = (
    auctionItemId: string,
    value: number
  ) => {
    const currentSetting = autoBidSettings[auctionItemId];
    if (currentSetting) {
      updateAutoBidSetting(auctionItemId, {
        ...currentSetting,
        maxPrice: value,
      });
    }
  };

  return (
    <div className="space-y-6">
      <AuctionHeader
        title={auction.title}
        description={auction.description || ''}
        status="ACTIVA"
      />

      {/* <ConnectionStatus
        isConnected={isConnected}
        isJoined={isJoined}
        participantCount={participantCount}
      /> */}

      {connectionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}

      <CountdownTimer
        status={auction.status}
        startTime={auction.startTime}
        endTime={auction.endTime}
        variant="card"
      />

      {/* Items Grid */}
      {auctionItems && auctionItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {auctionItems.map((auctionItem) => {
            const itemHistory = bidHistory[auctionItem.id] || [];
            const currentHighest = Number(
              itemHistory[0]?.amount ?? getHighestFromApi(auctionItem)
            );
            const bidIncrement = Number(auction.bidIncrement || 50000);
            const minNextBid = currentHighest + bidIncrement;
            const bidState = bidStates[auctionItem.id] || {
              amount: minNextBid.toString(),
              isPending: false,
              error: null,
            };
            const isUserWinning =
              itemHistory[0]?.userId === userId ||
              auctionItem.bids?.[0]?.userId === userId;

            return (
              <AuctionItemCard
                key={auctionItem.id}
                auctionItem={auctionItem}
                currentHighest={currentHighest}
                minNextBid={minNextBid}
                bidIncrement={bidIncrement}
                isUserWinning={isUserWinning}
                bidState={bidState}
                autoBidSetting={autoBidSettings[auctionItem.id]}
                isJoined={isJoined}
                bidHistory={itemHistory}
                userId={userId}
                onBidAmountChange={(value) =>
                  updateBidAmount(auctionItem.id, value)
                }
                onPlaceBid={() => placeBid(auctionItem.id)}
                onViewDetails={() => setSelectedItemForDetail(auctionItem)}
                onAutoBidToggle={() => handleAutoBidToggle(auctionItem.id)}
                onAutoBidMaxPriceChange={(value) =>
                  handleAutoBidMaxPriceChange(auctionItem.id, value)
                }
              />
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No hay items en esta subasta
        </p>
      )}

      {/* Dialogs */}
      <SelfBidWarningDialog
        isOpen={!!selfBidWarning}
        onConfirm={confirmSelfBid}
        onCancel={() => setSelfBidWarning(null)}
      />

      <AutoBidConfirmDialog
        isOpen={!!pendingAutoBid}
        maxPrice={pendingAutoBid?.maxPrice || 0}
        onConfirm={confirmAutoBid}
        onCancel={() => setPendingAutoBid(null)}
      />

      {selectedItemForDetail && (
        <AuctionItemDetailModal
          auctionItem={selectedItemForDetail}
          isOpen={!!selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          currentHighestBid={Number(
            bidHistory[selectedItemForDetail.id]?.[0]?.amount ??
              getHighestFromApi(selectedItemForDetail)
          )}
          bidIncrement={Number(auction.bidIncrement || 50000)}
          onPlaceBid={(amount) => {
            updateBidAmount(selectedItemForDetail.id, amount.toString());
            placeBid(selectedItemForDetail.id);
          }}
          isUserView={true}
          userId={userId}
          bidHistory={bidHistory[selectedItemForDetail.id] || []}
        />
      )}
    </div>
  );
}
