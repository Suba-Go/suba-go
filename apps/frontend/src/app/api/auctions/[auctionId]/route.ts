import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

// IMPORTANT: these endpoints back the live auction UI.
// Force dynamic execution on Vercel and prevent fetch caching.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = auth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  try {
    const { auctionId } = await params;

    // Session is attached by NextAuth wrapper and will include refreshed tokens when needed.
    const session = (request as any).auth;

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Tenant is normally available on the session, but under token-refresh races
    // (multiple concurrent requests) it can be temporarily missing.
    // Do NOT fail the request with 400 because:
    // - Backend auth still enforces tenant scoping using the JWT claims
    // - Returning 400/401 in bursts can trigger client redirects to /login
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      console.warn('Session has no tenantId (temporary). Proceeding with backend fetch.');
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/auctions/${auctionId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Subasta no encontrada' },
          { status: 404 }
        );
      }
      // Return error response instead of throwing
      return NextResponse.json(
        { error: `Error del backend: ${response.status}` },
        { status: response.status }
      );
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

    // Verify the auction belongs to the user's tenant (when we have tenantId)
    if (tenantId && deserializedData?.tenantId && deserializedData.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(deserializedData);
  } catch (error) {
    console.error('Error fetching auction:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});

export const PUT = auth(async function PUT(
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
      console.error('Auth error in PUT /api/auctions/[auctionId]:', authError);
      return NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 401 }
      );
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user has AUCTION_MANAGER role
    if (session.user.role !== 'AUCTION_MANAGER') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Backwards compatible mapping: some clients send itemIds instead of selectedItems
    // (backend expects selectedItems)
    if (body?.itemIds && !body?.selectedItems) {
      body.selectedItems = body.itemIds;
      delete body.itemIds;
    }


    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/auctions/${auctionId}`;

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al actualizar la subasta' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating auction:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});

export const DELETE = auth(async function DELETE(
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
        'Auth error in DELETE /api/auctions/[auctionId]:',
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

    // Verify user has AUCTION_MANAGER role
    if (session.user.role !== 'AUCTION_MANAGER') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/auctions/${auctionId}`;

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al eliminar la subasta' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting auction:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
