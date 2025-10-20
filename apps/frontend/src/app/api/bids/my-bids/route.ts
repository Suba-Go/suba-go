import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get user ID and tenant from session
    const userId = session.user.id;
    const tenantId = session.user.tenant?.id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/bids/user/${userId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Parse dates with superjson
    const parsedData = superjson.parse(JSON.stringify(data));

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error fetching user bids:', error);
    return NextResponse.json(
      { error: 'Error al obtener las pujas del usuario' },
      { status: 500 }
    );
  }
}

