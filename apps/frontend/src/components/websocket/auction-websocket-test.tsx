'use client';

import { useState, useEffect, useRef } from 'react';

type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'AUTHENTICATED' | 'JOINED';

interface Message {
  timestamp: string;
  direction: 'sent' | 'received';
  event: string;
  data: any;
}

interface AuctionWebSocketTestProps {
  accessToken: string;
  tenantId?: string;
  auctionId?: string;
}

export default function AuctionWebSocketTest({
  accessToken,
  tenantId = 'test-tenant-id',
  auctionId = 'test-auction-id',
}: AuctionWebSocketTestProps) {
  const [state, setState] = useState<ConnectionState>('DISCONNECTED');
  const [messages, setMessages] = useState<Message[]>([]);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  const addMessage = (direction: 'sent' | 'received', event: string, data: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { timestamp, direction, event, data }]);
    console.log(`[${timestamp}] ${direction === 'sent' ? '📤' : '📥'} ${event}:`, data);
  };

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    setState('CONNECTING');
    console.log('🔄 Connecting to WebSocket server...');

    // Connect with JWT token in query params
    const ws = new WebSocket(`ws://localhost:3001/ws?token=${accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connection opened');
      setState('CONNECTED');
      addMessage('received', 'CONNECTION_OPEN', {});

      // Send HELLO handshake
      console.log('📤 Sending HELLO message...');
      const helloMsg = JSON.stringify({ event: 'HELLO', data: {} });
      ws.send(helloMsg);
      addMessage('sent', 'HELLO', {});
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📥 Received:', message.event);
        addMessage('received', message.event, message.data);

        // Handle different message types
        switch (message.event) {
          case 'CONNECTED':
            console.log('✅ Server acknowledged connection');
            break;

          case 'HELLO_OK':
            console.log('✅ Handshake complete - AUTHENTICATED');
            setState('AUTHENTICATED');
            break;

          case 'JOINED':
            console.log('✅ Joined auction room');
            setState('JOINED');
            if (message.data?.participantCount !== undefined) {
              setParticipantCount(message.data.participantCount);
            }
            break;

          case 'LEFT':
            console.log('✅ Left auction room');
            setState('AUTHENTICATED');
            break;

          case 'PARTICIPANT_COUNT':
            console.log(`👥 Participant count: ${message.data.count}`);
            setParticipantCount(message.data.count);
            break;

          case 'BID_PLACED':
            console.log('💰 Bid placed:', message.data);
            break;

          case 'BID_REJECTED':
            console.log('❌ Bid rejected:', message.data);
            break;

          case 'AUCTION_STATUS_CHANGED':
            console.log('🔄 Auction status changed:', message.data);
            break;

          case 'ERROR':
            console.error('❌ Error:', message.data);
            break;

          default:
            console.log('📥 Unknown event:', message.event);
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      addMessage('received', 'ERROR', { error: 'Connection error' });
    };

    ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
      setState('DISCONNECTED');
      addMessage('received', 'CONNECTION_CLOSED', {
        code: event.code,
        reason: event.reason,
      });
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const joinAuction = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Not connected');
      return;
    }

    console.log(`📤 Joining auction: ${auctionId}`);
    const msg = JSON.stringify({
      event: 'JOIN_AUCTION',
      data: { tenantId, auctionId },
    });
    wsRef.current.send(msg);
    addMessage('sent', 'JOIN_AUCTION', { tenantId, auctionId });
  };

  const leaveAuction = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Not connected');
      return;
    }

    console.log(`📤 Leaving auction: ${auctionId}`);
    const msg = JSON.stringify({
      event: 'LEAVE_AUCTION',
      data: { tenantId, auctionId },
    });
    wsRef.current.send(msg);
    addMessage('sent', 'LEAVE_AUCTION', { tenantId, auctionId });
  };

  const placeBid = (amount: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Not connected');
      return;
    }

    console.log(`📤 Placing bid: $${amount}`);
    const msg = JSON.stringify({
      event: 'PLACE_BID',
      data: {
        tenantId,
        auctionId,
        auctionItemId: 'test-item-id',
        amount,
      },
    });
    wsRef.current.send(msg);
    addMessage('sent', 'PLACE_BID', { tenantId, auctionId, amount });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auction WebSocket Test</h1>

      {/* Connection Status */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Status:</span>
          <span
            className={`px-3 py-1 rounded ${
              state === 'DISCONNECTED'
                ? 'bg-red-200 text-red-800'
                : state === 'CONNECTING'
                ? 'bg-yellow-200 text-yellow-800'
                : state === 'CONNECTED'
                ? 'bg-blue-200 text-blue-800'
                : state === 'AUTHENTICATED'
                ? 'bg-green-200 text-green-800'
                : 'bg-purple-200 text-purple-800'
            }`}
          >
            {state}
          </span>
          {state === 'JOINED' && (
            <span className="ml-4 text-sm">
              👥 Participants: <strong>{participantCount}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={connect}
            disabled={state !== 'DISCONNECTED'}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={state === 'DISCONNECTED'}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
          >
            Disconnect
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={joinAuction}
            disabled={state !== 'AUTHENTICATED' && state !== 'JOINED'}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            Join Auction
          </button>
          <button
            onClick={leaveAuction}
            disabled={state !== 'JOINED'}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:bg-gray-300"
          >
            Leave Auction
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => placeBid(10000)}
            disabled={state !== 'JOINED'}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
          >
            Place Bid ($10,000)
          </button>
          <button
            onClick={() => placeBid(15000)}
            disabled={state !== 'JOINED'}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
          >
            Place Bid ($15,000)
          </button>
        </div>

        <button
          onClick={clearMessages}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Clear Messages
        </button>
      </div>

      {/* Message Log */}
      <div className="border rounded p-4 bg-white">
        <h2 className="font-semibold mb-2">Message Log:</h2>
        <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-sm">
          {messages.length === 0 ? (
            <p className="text-gray-400">No messages yet...</p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  msg.direction === 'sent' ? 'bg-blue-50' : 'bg-green-50'
                }`}
              >
                <div className="flex gap-2">
                  <span className="text-gray-500">[{msg.timestamp}]</span>
                  <span>{msg.direction === 'sent' ? '📤' : '📥'}</span>
                  <span className="font-semibold">{msg.event}</span>
                </div>
                <pre className="text-xs mt-1 text-gray-600">
                  {JSON.stringify(msg.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

