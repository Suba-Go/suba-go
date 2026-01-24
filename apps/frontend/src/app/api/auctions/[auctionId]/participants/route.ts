import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import superjson from 'superjson';

export const GET = auth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  try {
    const { auctionId } = await params;

    // Wrap auth() in try-catch to handle any errors
    let session;
    try {
      session = (request as any).auth;
    } catch (authError) {
      console.error(
        'Auth error in GET /api/auctions/[auctionId]/participants:',
        authError
      );
      return NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 401 }
      );
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only AUCTION_MANAGER can view participants
    if (session.user.role !== 'AUCTION_MANAGER') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/auctions/${auctionId}/participants`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      // Return empty array instead of throwing to prevent UI breaking
      return NextResponse.json([]);
    }

    const data = await response.json();

    // Handle superjson format from backend
    let deserializedData = data;
    if (data && typeof data === 'object' && 'superjson' in data) {
      try {
        deserializedData = superjson.deserialize(data.superjson);
      } catch (error) {
        console.error('Failed to deserialize superjson response:', error);
        deserializedData = data;
      }
    }

    // Ensure we return an array
    const result = Array.isArray(deserializedData) ? deserializedData : [];
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching auction participants:', error);
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json([]);
  }
});
