import { NextRequest, NextResponse } from 'next/server';

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
    const response = await fetch(
      `${backendUrl}/api/users/company-by-email?email=${encodeURIComponent(
        email
      )}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Forward the error response from backend
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const rawData = await response.json();

    // Handle SuperJSON response if present
    let data;
    if (rawData.superjson && rawData.superjson.json) {
      data = rawData.superjson.json;
    } else {
      data = rawData;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying request to backend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
