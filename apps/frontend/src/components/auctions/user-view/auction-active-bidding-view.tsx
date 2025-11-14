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
import { AuctionDto, AuctionItemDto } from '@suba-go/shared-validation';

interface AuctionActiveBiddingViewProps {
  auction: AuctionDto;
  accessToken: string;
  tenantId: string;
  userId: string;
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
    userName?: string;
    timestamp: number;
  }>;
}

export function AuctionActiveBiddingView({
  auction: initialAuction,
  accessToken,
  tenantId,
  userId,
}: AuctionActiveBiddingViewProps) {
  const [auction, setAuction] = useState<AuctionDto>(initialAuction);
  const [bidStates, setBidStates] = useState<BidState>({});
  const [bidHistory, setBidHistory] = useState<ItemBidHistory>({});
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemDto | null>(null);
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

      setBidHistory((prev) => ({
        ...prev,
        [auctionItemId]: [
          { id: bidId, amount, userId: bidderId, userName, timestamp },
          ...(prev[auctionItemId] || []),
        ].slice(0, 10),
      }));

      setBidStates((prev) => ({
        ...prev,
        [auctionItemId]: {
          ...prev[auctionItemId],
          isPending: false,
          error: null,
          amount:
            bidderId === userId
              ? prev[auctionItemId]?.amount || '0'
              : (amount + Number(auction.bidIncrement || 50000)).toString(),
        },
      }));

      setAuction((prev) => ({
        ...prev,
        items: prev.items?.map((item) =>
          item.id === auctionItemId
            ? {
                ...item,
                bids: [
                  {
                    id: bidId,
                    requestId: null,
                    offered_price: amount,
                    bid_time: new Date(timestamp),
                    userId: bidderId,
                    tenantId: prev.tenantId,
                    auctionId: prev.id,
                    auctionItemId: item.id,
                    user: userName
                      ? {
                          id: bidderId,
                          email: '',
                          password: '',
                          role: null,
                          public_name: userName,
                        }
                      : undefined,
                  },
                  ...(item.bids || []),
                ],
              }
            : item
        ),
      }));

      // Toast de éxito solo para la puja del usuario actual
      if (bidderId === userId) {
        toast({
          description:
            'Tu puja se realizó con éxito, estás ganando hasta el momento.',
          duration: 2000,
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

  const handleTimeExtension = useCallback((data: any) => {
    const { newEndTime, extensionSeconds } = data;
    setAuction((prev) => ({
      ...prev,
      endTime: new Date(newEndTime),
    }));
    console.log(
      `⏰ Tiempo extendido: +${extensionSeconds} segundos (cierre suave)`
    );
  }, []);

  const { isConnected, isJoined, participantCount, connectionError, sendBid } =
    useAuctionWebSocketBidding({
      auctionId: auction.id,
      tenantId,
      accessToken,
      onBidPlaced: handleBidPlaced,
      onBidRejected: handleBidRejected,
      onTimeExtension: handleTimeExtension,
    });

  // Initialize bid states
  useEffect(() => {
    if (auction.items) {
      const initialStates: BidState = {};
      auction.items.forEach((item) => {
        const currentHighest = Number(
          item.bids?.[0]?.offered_price || item.startingBid || 0
        );
        const bidIncrement = Number(auction.bidIncrement || 50000);
        const minNextBid = currentHighest + bidIncrement;

        initialStates[item.id] = {
          amount: minNextBid.toString(),
          isPending: false,
          error: null,
        };
      });
      setBidStates(initialStates);
    }
  }, [auction.items, auction.bidIncrement]);

  // Place bid function
  const placeBid = (auctionItemId: string, skipSelfBidCheck = false) => {
    const bidState = bidStates[auctionItemId];
    if (!bidState || bidState.isPending) return;

    const amount = Number(bidState.amount);
    const itemHistory = bidHistory[auctionItemId] || [];
    const currentHighestBidderId =
      itemHistory[0]?.userId ||
      auction.items?.find((i) => i.id === auctionItemId)?.bids?.[0]?.userId;

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
          auction.items?.find((i) => i.id === auctionItemId)?.bids?.[0]
            ?.offered_price ||
          auction.items?.find((i) => i.id === auctionItemId)?.startingBid ||
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
      {auction.items && auction.items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {auction.items.map((auctionItem) => {
            const itemHistory = bidHistory[auctionItem.id] || [];
            const currentHighest = Number(
              itemHistory[0]?.amount ||
                auctionItem.bids?.[0]?.offered_price ||
                auctionItem.startingBid ||
                0
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
            bidHistory[selectedItemForDetail.id]?.[0]?.amount ||
              selectedItemForDetail.bids?.[0]?.offered_price ||
              selectedItemForDetail.startingBid ||
              0
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
