/**
 * @file use-auction-bids.ts
 * @description Hook to fetch and manage auction bids from the API
 */
'use client';

import { useState, useEffect } from 'react';

interface Bid {
  id: string;
  offered_price: number;
  bid_time: string;
  userId: string;
  auctionItemId: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    public_name?: string;
  };
}

interface AuctionBidsResult {
  bids: Bid[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAuctionBids(
  auctionId: string | undefined,
  accessToken: string | undefined
): AuctionBidsResult {
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBids = async () => {
    if (!auctionId || !accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const url = `${backendUrl}/bids/auction/${auctionId}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('[useAuctionBids] Error response:', text);
        throw new Error(
          `Error al cargar las pujas: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[useAuctionBids] Non-JSON response:', text);
        throw new Error('La respuesta no es JSON válido');
      }

      const data = await response.json();

      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('[useAuctionBids] Response is not an array:', data);
        setBids([]);
        return;
      }

      // Check for duplicates in the response
      const uniqueIds = new Set(data.map((bid: Bid) => bid.id));
      if (uniqueIds.size !== data.length) {
        console.warn(
          '[useAuctionBids] Duplicate bids detected in API response!',
          `Total: ${data.length}, Unique: ${uniqueIds.size}`
        );
      }

      setBids(data);
    } catch (err) {
      console.error('[useAuctionBids] Error fetching bids:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Set empty array on error to avoid breaking the UI
      setBids([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [auctionId, accessToken]);

  return {
    bids,
    isLoading,
    error,
    refetch: fetchBids,
  };
}
