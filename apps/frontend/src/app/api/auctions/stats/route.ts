import { NextResponse } from 'next/server';
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

    // Get tenant from user session
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant' }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/auctions/stats/tenant/${tenantId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // If backend doesn't have stats endpoint yet, return mock data
      if (response.status === 404) {
        return NextResponse.json({
          totalAuctions: 0,
          activeAuctions: 0,
          totalParticipants: 0,
          totalRevenue: 0,
        });
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

    return NextResponse.json(deserializedData);
  } catch (error) {
    console.error('Error fetching auction stats:', error);

    // Return mock data as fallback (solo para errores internos del frontend)
    return NextResponse.json({
      totalAuctions: 0,
      activeAuctions: 0,
      totalParticipants: 0,
      totalRevenue: 0,
    });
  }
});
