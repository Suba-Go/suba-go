'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Badge } from '@suba-go/shared-components/components/ui/badge';

type ConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'AUTHENTICATED'
  | 'ERROR';

interface Message {
  event: string;
  data: any;
  timestamp: string;
}

interface SimpleWebSocketTestProps {
  accessToken: string;
}

export function SimpleWebSocketTest({ accessToken }: SimpleWebSocketTestProps) {
  const [state, setState] = useState<ConnectionState>('DISCONNECTED');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const addMessage = (event: string, data: any) => {
    setMessages((prev) => [
      ...prev,
      {
        event,
        data,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const connect = () => {
    if (!accessToken) {
      setError('No access token available. Please log in first.');
      addLog('❌ No access token - cannot connect');
      return;
    }

    setState('CONNECTING');
    setError(null);
    addLog('🔄 Connecting to WebSocket server...');

    // Connect to WebSocket with token in query string
    const wsUrl = `ws://localhost:3001/ws?token=${accessToken}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      addLog('✅ WebSocket connection opened');
      setState('CONNECTED');

      // Send HELLO message to complete handshake
      addLog('📤 Sending HELLO message...');
      socket.send(JSON.stringify({ event: 'HELLO', data: {} }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        addLog(`📥 Received: ${message.event}`);
        addMessage(message.event, message.data);

        // Check if handshake is complete
        if (message.event === 'HELLO_OK') {
          setState('AUTHENTICATED');
          addLog('✅ Handshake complete - AUTHENTICATED');
        }
      } catch (err) {
        addLog(`⚠️ Failed to parse message: ${event.data}`);
      }
    };

    socket.onerror = (event) => {
      addLog('❌ WebSocket error occurred');
      setError('WebSocket connection error');
      setState('ERROR');
    };

    socket.onclose = (event) => {
      addLog(`🔌 WebSocket closed (code: ${event.code})`);
      setState('DISCONNECTED');
      setWs(null);
    };

    setWs(socket);
  };

  const disconnect = () => {
    if (ws) {
      addLog('🔌 Disconnecting...');
      ws.close();
      setWs(null);
      setState('DISCONNECTED');
    }
  };

  const clearLogs = () => {
    setMessages([]);
    setLogs([]);
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const getStateBadgeColor = () => {
    switch (state) {
      case 'DISCONNECTED':
        return 'secondary';
      case 'CONNECTING':
        return 'default';
      case 'CONNECTED':
        return 'default';
      case 'AUTHENTICATED':
        return 'default';
      case 'ERROR':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'DISCONNECTED':
        return '⚪';
      case 'CONNECTING':
        return '🔄';
      case 'CONNECTED':
        return '🟡';
      case 'AUTHENTICATED':
        return '✅';
      case 'ERROR':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">WebSocket Handshake Test</CardTitle>
          <Badge variant={getStateBadgeColor()}>
            {getStateIcon()} {state}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          <Button
            onClick={connect}
            disabled={
              state === 'CONNECTING' ||
              state === 'CONNECTED' ||
              state === 'AUTHENTICATED'
            }
            variant="default"
          >
            Connect
          </Button>
          <Button
            onClick={disconnect}
            disabled={state === 'DISCONNECTED'}
            variant="outline"
          >
            Disconnect
          </Button>
          <Button onClick={clearLogs} variant="ghost">
            Clear Logs
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Connection Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Endpoint:</span>{' '}
            ws://localhost:3001/ws
          </div>
          <div>
            <span className="font-semibold">Messages:</span> {messages.length}
          </div>
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Received Messages:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-gray-50 rounded text-xs font-mono"
                >
                  <div className="font-semibold text-blue-600">{msg.event}</div>
                  <div className="text-gray-600">
                    {JSON.stringify(msg.data, null, 2)}
                  </div>
                  <div className="text-gray-400 text-[10px] mt-1">
                    {msg.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Connection Logs:</h4>
            <div className="p-3 bg-gray-900 text-gray-100 rounded text-xs font-mono max-h-40 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="py-0.5">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expected Flow */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <h4 className="font-semibold mb-2">Expected Flow:</h4>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Click "Connect" → State: CONNECTING</li>
            <li>JWT validated during upgrade → State: CONNECTED</li>
            <li>Client sends HELLO message automatically</li>
            <li>Server responds with HELLO_OK → State: AUTHENTICATED ✅</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
