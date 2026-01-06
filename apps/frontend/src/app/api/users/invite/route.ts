import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !session?.tokens?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/users/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    
    // Auto-unwrap SuperJSON response
    if (data && data.superjson) {
      try {
        const deserialized = superjson.deserialize(data.superjson);
        return NextResponse.json(deserialized, { status: resp.status });
      } catch (e) {
        console.error('Failed to deserialize superjson', e);
        // Fallback to original data if deserialization fails
        return NextResponse.json(data, { status: resp.status });
      }
    }

    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
