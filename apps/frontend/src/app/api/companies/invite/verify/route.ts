import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/companies/invite/verify?token=${encodeURIComponent(token)}`);
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
