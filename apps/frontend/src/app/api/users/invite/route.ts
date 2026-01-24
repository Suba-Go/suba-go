import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

export const POST = auth(async function POST(req: NextRequest) {
  try {
    const session = (req as any).auth;
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

    // Normalize NestJS error responses so the UI can consistently read `error`.
    // Nest usually returns: { statusCode, message, error }
    // Where `error` is often a generic label like "Conflict".
    if (!resp.ok) {
      const genericNestErrors = new Set([
        'Bad Request',
        'Conflict',
        'Unauthorized',
        'Forbidden',
        'Not Found',
        'Internal Server Error',
      ]);

      const msg =
        // Prefer explicit message (string)
        (typeof data?.message === 'string' ? data.message : undefined) ||
        // Or validation message arrays
        (Array.isArray(data?.message) && data.message.length
          ? String(data.message[0])
          : undefined) ||
        // Some handlers wrap as { message: { error: "..." } }
        (typeof data?.message?.error === 'string' ? data.message.error : undefined) ||
        // Only use `error` if it's not a generic Nest label
        (typeof data?.error === 'string' && !genericNestErrors.has(data.error)
          ? data.error
          : undefined) ||
        'No se pudo generar el link';

      return NextResponse.json({ error: msg }, { status: resp.status });
    }
    
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
});
