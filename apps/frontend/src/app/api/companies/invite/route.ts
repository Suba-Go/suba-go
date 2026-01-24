import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const POST = auth(async function POST(req: NextRequest) {
  try {
    const session = (req as any).auth;
    if (!session?.user || !session?.tokens?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/companies/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
