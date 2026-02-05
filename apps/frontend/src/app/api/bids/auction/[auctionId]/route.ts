import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';
import { readBackendError } from '@/lib/read-backend-error';

// IMPORTANT: this endpoint backs the live bidding UI.
// Force dynamic execution on Vercel and prevent caching.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LIVE_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
} as const;

/**
 * Proxy: GET /api/bids/auction/:auctionId
 *
 * Why:
 * - Avoid calling the backend directly from the browser with a Bearer token.
 * - Ensure NextAuth refresh/rotation can happen and Set-Cookie can be persisted.
 */
export const GET = auth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  try {
    const session = (request as any).auth;

    if (!session?.tokens?.accessToken) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    const { auctionId } = await params;

    const backendUrl = `${process.env.BACKEND_URL}/bids/auction/${auctionId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const message = await readBackendError(response);
      return NextResponse.json(
        { error: message },
        { status: response.status, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    const data = await response.json();

    // Handle superjson format from backend
    let deserializedData = data;
    if (data && typeof data === 'object' && 'superjson' in data) {
      try {
        deserializedData = superjson.deserialize((data as any).superjson);
      } catch (error) {
        console.error('Failed to deserialize superjson response:', error);
        deserializedData = data;
      }
    }

    // Ensure an array for the client (defensive)
    if (!Array.isArray(deserializedData)) {
      return NextResponse.json([], { headers: LIVE_NO_STORE_HEADERS });
    }

    return NextResponse.json(deserializedData, { headers: LIVE_NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error fetching auction bids:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: LIVE_NO_STORE_HEADERS }
    );
  }
});
