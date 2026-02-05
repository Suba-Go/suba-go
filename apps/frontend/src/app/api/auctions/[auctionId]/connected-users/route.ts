import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// IMPORTANT: this endpoint powers a live view.
// Force dynamic execution on Vercel and prevent caching.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LIVE_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
} as const;

export const GET = auth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  try {
    const { auctionId } = await params;
    const session = (request as any).auth;

    if (!session?.user || !session?.tokens?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    // Only AUCTION_MANAGER/ADMIN can see live connected users for an auction
    if (session.user.role !== 'AUCTION_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(
      `${backendUrl}/auctions/${auctionId}/connected-users`,
      {
        headers: {
          Authorization: `Bearer ${session.tokens.accessToken}`,
        },
        cache: 'no-store',
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Failed to fetch connected users' },
        { status: response.status, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: LIVE_NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error fetching connected users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: LIVE_NO_STORE_HEADERS }
    );
  }
});
