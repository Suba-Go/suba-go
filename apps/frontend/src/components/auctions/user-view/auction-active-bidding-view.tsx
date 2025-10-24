/**
 * @file auction-active-bidding-view.tsx
 * @description USER view for active auctions with real-time bidding via WebSocket
 * @author Suba&Go
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { FormattedInput } from '@/components/ui/formatted-input';
import {
  Alert,
  AlertDescription,
} from '@suba-go/shared-components/components/ui/alert';
import { CountdownTimer } from '../countdown-timer';
import { AuctionItemDetailModal } from '../auction-item-detail-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import {
  Gavel,
  TrendingUp,
  Clock,
  User,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Zap,
} from 'lucide-react';
import type { AuctionData } from '@/types/auction.types';

interface AuctionActiveBiddingViewProps {
  auction: AuctionData;
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
  const wsRef = useRef<WebSocket | null>(null);
  const [auction, setAuction] = useState<AuctionData>(initialAuction);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [bidStates, setBidStates] = useState<BidState>({});
  const [bidHistory, setBidHistory] = useState<ItemBidHistory>({});
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<
    any | null
  >(null);
  const [selfBidWarning, setSelfBidWarning] = useState<{
    auctionItemId: string;
    amount: number;
  } | null>(null);

  // Pending auto-bid settings (before confirmation)
  const [pendingAutoBid, setPendingAutoBid] = useState<{
    auctionItemId: string;
    maxPrice: number;
  } | null>(null);
  const [autoBidSettings, setAutoBidSettings] = useState<{
    [auctionItemId: string]: { enabled: boolean; maxPrice: number };
  }>({});

  // WebSocket endpoint - MUST use port 3001 (backend port)
  const wsEndpoint =
    process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:3001/ws';

  // Load auto-bid settings from cookies on mount
  useEffect(() => {
    const cookieName = `autoBid_${auction.id}`;
    const savedSettings = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${cookieName}=`));

    if (savedSettings) {
      try {
        const settings = JSON.parse(
          decodeURIComponent(savedSettings.split('=')[1])
        );
        setAutoBidSettings(settings);
      } catch (error) {
        console.error('Error loading auto-bid settings:', error);
      }
    }
  }, [auction.id]);

  // Save auto-bid settings to cookies whenever they change
  useEffect(() => {
    if (Object.keys(autoBidSettings).length > 0) {
      const cookieName = `autoBid_${auction.id}`;
      const cookieValue = encodeURIComponent(JSON.stringify(autoBidSettings));
      // Expire in 7 days
      const expires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toUTCString();
      document.cookie = `${cookieName}=${cookieValue}; expires=${expires}; path=/`;
    }
  }, [autoBidSettings, auction.id]);

  // Initialize bid states for all items
  useEffect(() => {
    if (auction.items) {
      const initialStates: BidState = {};
      auction.items.forEach((item) => {
        // Convert to numbers to avoid string concatenation
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

  // Handler functions (defined before WebSocket useEffect to avoid hoisting issues)
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

      // Update bid history
      setBidHistory((prev) => ({
        ...prev,
        [auctionItemId]: [
          { id: bidId, amount, userId: bidderId, userName, timestamp },
          ...(prev[auctionItemId] || []),
        ].slice(0, 10), // Keep last 10 bids
      }));

      // Clear pending state if this was our bid
      setBidStates((prev) => ({
        ...prev,
        [auctionItemId]: {
          ...prev[auctionItemId],
          isPending: false,
          error: null,
          amount: (amount + Number(auction.bidIncrement || 50000)).toString(),
        },
      }));

      // Auto-bid logic: if another user bid and we have auto-bid enabled
      if (bidderId !== userId) {
        const autoBid = autoBidSettings[auctionItemId];
        if (autoBid?.enabled && autoBid.maxPrice) {
          const nextBidAmount = amount + Number(auction.bidIncrement || 50000);

          // Only auto-bid if we haven't reached our max price
          if (nextBidAmount <= autoBid.maxPrice) {
            console.log(
              `[Auto-Bid] Placing automatic bid of $${nextBidAmount} (max: $${autoBid.maxPrice})`
            );

            // Wait a short delay to make it feel more natural
            setTimeout(() => {
              if (wsRef.current && isJoined) {
                wsRef.current.send(
                  JSON.stringify({
                    event: 'PLACE_BID',
                    data: {
                      tenantId,
                      auctionId: auction.id,
                      auctionItemId,
                      amount: nextBidAmount,
                      clientBidId: `${userId}-auto-${Date.now()}`,
                    },
                  })
                );
              }
            }, 1000); // 1 second delay
          } else {
            console.log(
              `[Auto-Bid] Max price reached ($${autoBid.maxPrice}), stopping auto-bid`
            );
          }
        }
      }
    },
    [
      auction.bidIncrement,
      auction.id,
      autoBidSettings,
      isJoined,
      tenantId,
      userId,
    ]
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

    // Clear error after 5 seconds
    setTimeout(() => {
      setBidStates((prev) => ({
        ...prev,
        [auctionItemId]: {
          ...prev[auctionItemId],
          error: null,
        },
      }));
    }, 5000);
  }, []);

  const handleTimeExtension = useCallback((data: any) => {
    const { newEndTime, extensionSeconds } = data;
    console.log(
      `[WS] ⏰ Auction time extended by ${extensionSeconds}s to ${newEndTime}`
    );

    // Update auction end time in state
    setAuction((prev) => ({
      ...prev,
      endTime: newEndTime,
    }));

    // Show toast notification
    // You can add a toast library here if needed
    console.log(
      `⏰ Tiempo extendido: +${extensionSeconds} segundos (cierre suave)`
    );
  }, []);

  const handleWebSocketMessage = useCallback(
    (message: any) => {
      console.log('[WS] Received:', message.event, message.data);

      switch (message.event) {
        case 'HELLO_OK':
          setIsConnected(true);
          break;

        case 'JOINED':
          setIsJoined(true);
          if (message.data.participantCount) {
            setParticipantCount(message.data.participantCount);
          }
          break;

        case 'PARTICIPANT_COUNT':
          setParticipantCount(message.data.count);
          break;

        case 'BID_PLACED':
          handleBidPlaced(message.data);
          break;

        case 'BID_REJECTED':
          handleBidRejected(message.data);
          break;

        case 'AUCTION_TIME_EXTENDED':
          handleTimeExtension(message.data);
          break;

        case 'AUCTION_STATUS_CHANGED':
          // Handle status changes (e.g., auction ended)
          console.log('[WS] Auction status changed:', message.data.status);
          if (message.data.status === 'COMPLETADA') {
            // Reload page to show completed view
            window.location.reload();
          }
          break;

        case 'ERROR':
          console.error('[WS] Server error:', message.data);
          setConnectionError(message.data.message);
          break;
      }
    },
    [handleBidPlaced, handleBidRejected, handleTimeExtension]
  );

  // WebSocket connection management
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // CRITICAL: Token must be in query parameter for authentication during HTTP upgrade
        const wsUrl = `${wsEndpoint}?token=${encodeURIComponent(accessToken)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[WS] Connected');
          setConnectionError(null);

          // Send HELLO message to complete double handshake
          ws.send(
            JSON.stringify({
              event: 'HELLO',
              data: {},
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error('[WS] Failed to parse message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          setConnectionError('Error de conexión WebSocket');
        };

        ws.onclose = () => {
          console.log('[WS] Disconnected');
          setIsConnected(false);
          setIsJoined(false);
        };
      } catch (error) {
        console.error('[WS] Connection failed:', error);
        setConnectionError('No se pudo conectar al servidor');
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        console.log('[WS] Closing connection');
        wsRef.current.close();
      }
    };
  }, [wsEndpoint, accessToken, handleWebSocketMessage]);

  // Join auction room after connection
  useEffect(() => {
    if (isConnected && !isJoined && wsRef.current) {
      console.log('[WS] Joining auction room');
      wsRef.current.send(
        JSON.stringify({
          event: 'JOIN_AUCTION',
          data: { tenantId, auctionId: auction.id },
        })
      );
    }
  }, [isConnected, isJoined, tenantId, auction.id]);

  const placeBid = (auctionItemId: string, skipWarning = false) => {
    if (!wsRef.current || !isJoined) {
      alert('No estás conectado a la subasta');
      return;
    }

    const bidState = bidStates[auctionItemId];
    const amount = Number(bidState.amount);

    if (isNaN(amount) || amount <= 0) {
      setBidStates((prev) => ({
        ...prev,
        [auctionItemId]: {
          ...prev[auctionItemId],
          error: 'Monto inválido',
        },
      }));
      return;
    }

    // Check if user is bidding against themselves
    if (!skipWarning) {
      const itemHistory = bidHistory[auctionItemId];
      const lastBid = itemHistory?.[0];

      if (lastBid && lastBid.userId === userId) {
        // Show warning dialog
        setSelfBidWarning({ auctionItemId, amount });
        return;
      }
    }

    // Set pending state
    setBidStates((prev) => ({
      ...prev,
      [auctionItemId]: {
        ...prev[auctionItemId],
        isPending: true,
        error: null,
      },
    }));

    // Send bid via WebSocket - MUST include tenantId and auctionId
    wsRef.current.send(
      JSON.stringify({
        event: 'PLACE_BID',
        data: {
          tenantId, // Required by backend for authorization
          auctionId: auction.id, // Required by backend
          auctionItemId,
          amount,
          clientBidId: `${userId}-${Date.now()}`,
        },
      })
    );
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{auction.title}</h1>
          {auction.description && (
            <p className="text-gray-600 mt-2">{auction.description}</p>
          )}
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-300">
          Activa
        </Badge>
      </div>

      {/* Connection Status */}
      <Card
        className={
          isConnected
            ? 'border-green-200 bg-green-50'
            : 'border-yellow-200 bg-yellow-50'
        }
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-yellow-600" />
              )}
              <span
                className={
                  isConnected
                    ? 'text-green-900 font-medium'
                    : 'text-yellow-900 font-medium'
                }
              >
                {isConnected ? 'Conectado en tiempo real' : 'Conectando...'}
              </span>
            </div>
            {isJoined && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>
                  {participantCount} participante
                  {participantCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {connectionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}

      {/* Countdown Timer */}
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
            // Get current highest bid from WebSocket history or initial data
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
              <Card key={auctionItem.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {auctionItem.item?.plate || 'Sin Patente'}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {auctionItem.item?.brand} {auctionItem.item?.model}{' '}
                        {auctionItem.item?.year}
                      </p>
                    </div>
                    {isUserWinning && (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ganando
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-6">
                  {/* Current Price Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        Precio Base
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {formatCurrency(Number(auctionItem.startingBid || 0))}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600 font-medium mb-1">
                        Puja Actual
                      </p>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(currentHighest)}
                      </p>
                    </div>
                  </div>

                  {/* Bid Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Tu Puja (mínimo: {formatCurrency(minNextBid)})
                    </label>
                    <div className="flex gap-2">
                      <FormattedInput
                        formatType="price"
                        value={bidState.amount}
                        onChange={(value) =>
                          updateBidAmount(
                            auctionItem.id,
                            value?.toString() || '0'
                          )
                        }
                        disabled={bidState.isPending || !isJoined}
                        className="flex-1"
                        placeholder={formatCurrency(minNextBid)}
                      />
                      <Button
                        onClick={() => placeBid(auctionItem.id)}
                        disabled={
                          bidState.isPending ||
                          !isJoined ||
                          Number(bidState.amount) < minNextBid
                        }
                        className="min-w-[120px]"
                      >
                        {bidState.isPending ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Pujando...
                          </>
                        ) : (
                          <>
                            <Gavel className="h-4 w-4 mr-2" />
                            Pujar
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Incremento mínimo:{' '}
                      {formatCurrency(Number(auction.bidIncrement || 50000))}
                    </p>
                  </div>

                  {/* Auto-Bid Section */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">
                          Puja Automática
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          El sistema pujará automáticamente cuando otros
                          usuarios superen tu oferta
                        </p>
                      </div>
                      {autoBidSettings[auctionItem.id]?.enabled && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-300"
                        >
                          ✓ Activa
                        </Badge>
                      )}
                    </div>

                    {!autoBidSettings[auctionItem.id]?.enabled ? (
                      <div className="space-y-3 pl-0">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-600 font-medium">
                            Precio Máximo
                          </label>
                          <Input
                            type="number"
                            value={
                              pendingAutoBid?.auctionItemId === auctionItem.id
                                ? pendingAutoBid.maxPrice
                                : ''
                            }
                            onChange={(e) => {
                              const maxPrice = Number(e.target.value);
                              setPendingAutoBid({
                                auctionItemId: auctionItem.id,
                                maxPrice,
                              });
                            }}
                            min={
                              currentHighest +
                              Number(auction.bidIncrement || 50000)
                            }
                            step={Number(auction.bidIncrement || 50000)}
                            className="text-sm"
                            placeholder="Ej: 5000000"
                            disabled={!isJoined}
                          />
                          <p className="text-xs text-gray-500">
                            Ingresa el monto máximo que estás dispuesto a pagar
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            if (
                              pendingAutoBid?.auctionItemId ===
                                auctionItem.id &&
                              pendingAutoBid.maxPrice > currentHighest
                            ) {
                              setAutoBidSettings((prev) => ({
                                ...prev,
                                [auctionItem.id]: {
                                  enabled: true,
                                  maxPrice: pendingAutoBid.maxPrice,
                                },
                              }));
                              setPendingAutoBid(null);
                            }
                          }}
                          disabled={
                            !isJoined ||
                            !pendingAutoBid ||
                            pendingAutoBid.auctionItemId !== auctionItem.id ||
                            pendingAutoBid.maxPrice <= currentHighest
                          }
                          className="w-full gap-2"
                          variant="default"
                        >
                          <Zap className="h-4 w-4" />
                          Activar Puja Automática
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            Precio Máximo:
                          </span>
                          <span className="text-sm font-bold text-green-700">
                            $
                            {autoBidSettings[
                              auctionItem.id
                            ]?.maxPrice.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <Button
                          onClick={() => {
                            setAutoBidSettings((prev) => {
                              const newSettings = { ...prev };
                              delete newSettings[auctionItem.id];
                              return newSettings;
                            });
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Desactivar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedItemForDetail(auctionItem)}
                    className="w-full gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Detalles Completos
                  </Button>

                  {/* Error Message */}
                  {bidState.error && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{bidState.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Bid History */}
                  {itemHistory.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Historial de Pujas
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {itemHistory.map((bid, index) => (
                          <div
                            key={bid.id}
                            className={`flex items-center justify-between text-sm p-2 rounded ${
                              index === 0
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-gray-500" />
                              <span
                                className={
                                  index === 0
                                    ? 'font-semibold text-green-900'
                                    : 'text-gray-700'
                                }
                              >
                                {bid.userId === userId
                                  ? 'Tú'
                                  : bid.userName || 'Usuario'}
                              </span>
                            </div>
                            <span
                              className={
                                index === 0
                                  ? 'font-bold text-green-900'
                                  : 'font-medium text-gray-900'
                              }
                            >
                              {formatCurrency(bid.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Static Bid History from Initial Data */}
                  {itemHistory.length === 0 &&
                    auctionItem.bids &&
                    auctionItem.bids.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Pujas Anteriores
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {auctionItem.bids.slice(0, 5).map((bid, index) => (
                            <div
                              key={bid.id}
                              className={`flex items-center justify-between text-sm p-2 rounded ${
                                index === 0
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-gray-500" />
                                <span
                                  className={
                                    index === 0
                                      ? 'font-semibold text-green-900'
                                      : 'text-gray-700'
                                  }
                                >
                                  {bid.userId === userId
                                    ? 'Tú'
                                    : bid.user?.public_name || 'Usuario'}
                                </span>
                              </div>
                              <span
                                className={
                                  index === 0
                                    ? 'font-bold text-green-900'
                                    : 'font-medium text-gray-900'
                                }
                              >
                                {formatCurrency(bid.offered_price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No hay vehículos en esta subasta
          </CardContent>
        </Card>
      )}

      {/* Item Detail Modal */}
      {selectedItemForDetail && (
        <AuctionItemDetailModal
          isOpen={!!selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          auctionItem={selectedItemForDetail}
          currentHighestBid={Number(
            bidHistory[selectedItemForDetail.id]?.[0]?.amount ||
              selectedItemForDetail.bids?.[0]?.offered_price ||
              selectedItemForDetail.startingBid ||
              0
          )}
          bidIncrement={Number(auction.bidIncrement || 50000)}
          onPlaceBid={(amount) => {
            // Update bid amount in state and place bid
            updateBidAmount(selectedItemForDetail.id, amount.toString());
            placeBid(selectedItemForDetail.id);
            setSelectedItemForDetail(null);
          }}
          isUserView={true}
          userId={userId}
        />
      )}

      {/* Self-Bid Warning Dialog */}
      <Dialog
        open={!!selfBidWarning}
        onOpenChange={(open) => !open && setSelfBidWarning(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              ¿Incrementar tu propia puja?
            </DialogTitle>
            <DialogDescription>
              La última puja fue tuya. ¿Estás seguro que quieres incrementar tu
              oferta?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Tu puja actual será reemplazada por la nueva oferta de{' '}
              <span className="font-bold text-gray-900">
                ${selfBidWarning?.amount.toLocaleString()}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelfBidWarning(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmSelfBid} className="gap-2">
              <Gavel className="h-4 w-4" />
              Confirmar Puja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
