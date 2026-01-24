import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

export const GET = auth(async function GET(request: any) {
  try {
    const session = (request as any).auth;

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Forward request to backend - use endpoint that gets current user's bids
    const backendUrl = `${process.env.BACKEND_URL}/bids/my-bids`;

    const response = await fetch(backendUrl, {
      method: 'GET',
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
      return NextResponse.json([]);
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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user bids:', error);
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json([]);
  }
});
