import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

// IMPORTANT: this endpoint powers the live auction list.
// Force dynamic execution on Vercel and prevent fetch caching.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LIVE_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
} as const;

async function readBackendError(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json: any = await response.json();
      return (
        json?.message ||
        json?.error ||
        json?.details ||
        `Backend responded with status: ${response.status}`
      );
    }
    const text = await response.text();
    return text || `Backend responded with status: ${response.status}`;
  } catch {
    return `Backend responded with status: ${response.status}`;
  }
}

export const GET = auth(async function GET(request: any) {
  try {
    const session = (request as any).auth;

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    const accessToken = session.tokens?.accessToken;
    if (!accessToken) {
      // Evita enviar "Bearer undefined" al backend y convertir el 401 en 500
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    // Get tenant from user session
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant' },
        { status: 400, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    // Client requirement: USER must not list all tenant auctions
    // They should only see auctions where they are registered.
    if (session.user.role === 'USER') {
      return NextResponse.json(
        { error: 'Acceso restringido. Usa /api/auctions/my-registrations' },
        { status: 403, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/auctions/tenant/${tenantId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
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
    if (data && data.superjson) {
      try {
        deserializedData = superjson.deserialize(data.superjson);
      } catch (error) {
        console.error('Failed to deserialize superjson response:', error);
        deserializedData = data;
      }
    }

    return NextResponse.json(deserializedData, { headers: LIVE_NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: LIVE_NO_STORE_HEADERS }
    );
  }
});

export const POST = auth(async function POST(request: NextRequest) {
  try {
    const session = (request as any).auth;

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accessToken = session.tokens?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user has AUCTION_MANAGER role
    if (session.user.role !== 'AUCTION_MANAGER') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Get tenant from user session
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant' }, { status: 400 });
    }

    const body = await request.json();

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/auctions`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ...body,
        tenantId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
      return NextResponse.json(
        { error: errorData.message || 'Error al crear la subasta' },
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

    return NextResponse.json(deserializedData);
  } catch (error) {
    console.error('Error creating auction:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
