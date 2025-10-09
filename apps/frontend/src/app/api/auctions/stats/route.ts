import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get tenant from user session
    const tenantId = session.user.tenant?.id;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/auctions/stats/tenant/${tenantId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
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
      throw new Error(`Backend responded with status: ${response.status}`);
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

    // Return mock data as fallback
    return NextResponse.json({
      totalAuctions: 0,
      activeAuctions: 0,
      totalParticipants: 0,
      totalRevenue: 0,
    });
  }
}
