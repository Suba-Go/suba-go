import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get tenant from user session
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/items/${itemId}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
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
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user has AUCTION_MANAGER role
    if (session.user.role !== 'AUCTION_MANAGER') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Get tenant from user session
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/items/${itemId}`;

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al eliminar el item' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user has AUCTION_MANAGER role
    if (session.user.role !== 'AUCTION_MANAGER') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Get tenant from user session
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL}/items/${itemId}`;

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.tokens.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al actualizar el item' },
        { status: response.status }
      );
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
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
