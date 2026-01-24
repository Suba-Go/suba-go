import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accessToken = session.tokens?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // USER should not be able to list all tenant items
    // (they can only see items through their registered auctions or their awards)
    if (session.user.role === 'USER') {
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

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/items/tenant/${tenantId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
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

    return NextResponse.json(deserializedData);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
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
    const backendUrl = `${process.env.BACKEND_URL}/items`;

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
        { error: errorData.message || 'Error al crear el item' },
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
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
