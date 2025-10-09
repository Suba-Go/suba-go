import { NextRequest, NextResponse } from 'next/server';
import superjson from 'superjson';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const fullUrl = `${backendUrl}/api/users/company-by-email?email=${encodeURIComponent(
      email
    )}`;
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Forward the error response from backend
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
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
    console.error('Error proxying request to backend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
