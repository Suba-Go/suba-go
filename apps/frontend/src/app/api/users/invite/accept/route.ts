import { NextRequest, NextResponse } from 'next/server';
import superjson from 'superjson';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/users/invite/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
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
