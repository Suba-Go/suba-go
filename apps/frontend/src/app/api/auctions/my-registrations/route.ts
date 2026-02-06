import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

// IMPORTANT: this endpoint backs the live user auction list.
// Force dynamic execution on Vercel and prevent caching.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LIVE_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
} as const;

export const GET = auth(async function GET(request: any) {
  try {
    const session = (request as any).auth;

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: LIVE_NO_STORE_HEADERS }
      );
    }

    // Forward request to backend - use new endpoint that gets current user's registrations
    const backendUrl = `${process.env.BACKEND_URL}/auctions/my-registrations`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Backend error (${response.status}):`,
        errorText.substring(0, 200)
      );
      // Return empty array instead of error to prevent UI breaking
      return NextResponse.json([], { headers: LIVE_NO_STORE_HEADERS });
    }

    const data = await response.json();

    // Handle superjson format from backend
    let deserializedData = data;
    if (data && typeof data === 'object' && 'superjson' in data) {
      try {
        deserializedData = superjson.deserialize(data.superjson);
      } catch (error) {
        console.error('Failed to deserialize superjson response:', error);
        deserializedData = data;
      }
    }

    // Ensure we return an array
    const result = Array.isArray(deserializedData) ? deserializedData : [];

    return NextResponse.json(result, { headers: LIVE_NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json([], { headers: LIVE_NO_STORE_HEADERS });
  }
});
