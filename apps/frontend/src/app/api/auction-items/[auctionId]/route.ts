import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';
import { readBackendError } from '@/lib/read-backend-error';

// IMPORTANT: these endpoints back the live auction UI.
// Force dynamic execution on Vercel and prevent fetch caching.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = auth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  try {
    const session = (request as any).auth;

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accessToken = session.tokens?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { auctionId } = await params;

    const backendUrl = `${process.env.BACKEND_URL}/auction-items/auction/${auctionId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Items de la subasta no encontrados' },
          { status: 404 }
        );
      }
      const message = await readBackendError(response);
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = await response.json();

    // Handle superjson format from backend
    let deserializedData = data;
    if (data && data.superjson) {
      try {
        deserializedData = superjson.deserialize(data.superjson);
      } catch (error) {
        console.error('Failed to deserialize superjson response:', error);
        deserializedData = data;
      }
    }

    // Client requirement:
    // - USER must NOT see the real name/email of other bidders
    // - AUCTION_MANAGER/ADMIN can see real identities
    if (session.user.role === 'USER' && Array.isArray(deserializedData)) {
      const currentUserId = session.user.id;

      deserializedData = deserializedData.map((auctionItem: any) => {
        if (!auctionItem || !Array.isArray(auctionItem.bids)) return auctionItem;

        const sanitizedBids = auctionItem.bids.map((bid: any) => {
          const u = bid?.user;
          if (!u) return bid;

          // Keep own data intact; redact others.
          if (u.id === currentUserId) return bid;

          return {
            ...bid,
            user: {
              ...u,
              name: null,
              // Keep a valid email format to avoid breaking schema/clients,
              // but do not reveal the real email.
              email: `hidden+${String(u.id || 'user').slice(0, 8)}@example.com`,
            },
          };
        });

        return { ...auctionItem, bids: sanitizedBids };
      });
    }

    return NextResponse.json(deserializedData);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
