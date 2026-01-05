import { NextRequest, NextResponse } from 'next/server';
import superjson from 'superjson';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const resp = await fetch(
      `${backendUrl}/users/invite/verify?token=${encodeURIComponent(token)}`
    );
    const data = await resp.json();

    if (data && data.superjson) {
      try {
        const deserialized = superjson.deserialize(data.superjson);
        return NextResponse.json(deserialized, { status: resp.status });
      } catch (e) {
        console.error('Failed to deserialize superjson', e);
        return NextResponse.json(data, { status: resp.status });
      }
    }

    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
