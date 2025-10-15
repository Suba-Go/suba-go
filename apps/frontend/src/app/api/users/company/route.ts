import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get company ID from user session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Usuario sin empresa asignada' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/users/company/${companyId}`;

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
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
