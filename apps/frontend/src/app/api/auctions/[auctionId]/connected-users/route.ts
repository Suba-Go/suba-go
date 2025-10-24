import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  try {
    const { auctionId } = await params;
    const session = await auth();

    if (!session?.user || !session?.tokens?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(
      `${backendUrl}/auctions/${auctionId}/connected-users`,
      {
        headers: {
          Authorization: `Bearer ${session.tokens.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Failed to fetch connected users' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching connected users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
