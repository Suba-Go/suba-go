import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';
import { readBackendError } from '@/lib/read-backend-error';

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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { auctionId } = await params;

    const backendUrl = `${process.env.BACKEND_URL}/bids/auction/${auctionId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const message = await readBackendError(response);
      return NextResponse.json({ error: message }, { status: response.status });
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
      return NextResponse.json([]);
    }

    return NextResponse.json(deserializedData);
  } catch (error) {
    console.error('Error fetching auction bids:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
