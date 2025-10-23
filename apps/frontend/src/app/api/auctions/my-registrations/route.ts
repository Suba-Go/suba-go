import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Forward request to backend - use new endpoint that gets current user's registrations
    const backendUrl = `${process.env.BACKEND_URL}/auctions/my-registrations`;

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
    console.error('Error fetching user registrations:', error);
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json([]);
  }
}
