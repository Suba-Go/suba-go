import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if user is auction manager
    if (session.user.role !== 'AUCTION_MANAGER') {
      return NextResponse.json(
        { error: 'No tienes permisos para descancelar subastas' },
        { status: 403 }
      );
    }

    const { auctionId } = await params;

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/auctions/${auctionId}/uncancel`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al descancelar la subasta' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uncanceling auction:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

