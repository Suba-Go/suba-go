import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get tenant from user session for organizing files
    const tenantId = session.user.tenant?.id;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant' },
        { status: 400 }
      );
    }

    // Get the filename from query params
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Nombre de archivo requerido' },
        { status: 400 }
      );
    }

    // Get the file from the request body
    const file = await request.blob();

    if (!file || file.size === 0) {
      console.error('Invalid file:', { size: file?.size, type: file?.type });
      return NextResponse.json(
        { error: 'Archivo no válido o vacío' },
        { status: 400 }
      );
    }

    console.log('Uploading file:', {
      filename,
      size: file.size,
      type: file.type,
      tenantId,
    });

    // Upload to Vercel Blob with tenant-specific path
    // This organizes files by tenant for better management
    const blob = await put(`${tenantId}/${filename}`, file, {
      access: 'public',
      addRandomSuffix: true, // Prevents filename collisions
    });

    console.log('Upload successful:', blob.url);

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error al subir el archivo',
      },
      { status: 500 }
    );
  }
}
