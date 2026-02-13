import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';
import { readBackendError } from '@/lib/read-backend-error';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LIVE_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
} as const;

/**
 * Proxy: GET /api/bids/item/:auctionItemId/paged?limit=50&cursor=...
 */
export const GET = auth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auctionItemId: string }> }
) {
  try {
    const session = (request as any).auth;
    if (!session?.tokens?.accessToken) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    const { auctionItemId } = await params;
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const cursor = url.searchParams.get('cursor');

    const backendUrl = new URL(
      `${process.env.BACKEND_URL}/bids/item/${auctionItemId}/paged`
    );
    if (limit) backendUrl.searchParams.set('limit', limit);
    if (cursor) backendUrl.searchParams.set('cursor', cursor);

    const response = await fetch(backendUrl.toString(), {
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

    // Defensive: ensure object shape
    if (!deserializedData || typeof deserializedData !== 'object') {
      return NextResponse.json(
        { items: [], nextCursor: null },
        { headers: LIVE_NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(deserializedData, { headers: LIVE_NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error fetching paged item bids:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: LIVE_NO_STORE_HEADERS }
    );
  }
});
