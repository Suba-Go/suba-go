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

export const GET = auth(async function GET(request: NextRequest) {
  try {
    const session = (request as any).auth;

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accessToken = session.tokens?.accessToken;
    if (!accessToken) {
      // Evita enviar "Bearer undefined" al backend y convertir el 401 en 500
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
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
