import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import crypto from 'crypto';
import { auth } from '@/auth';
import { normalizeCompanyName } from '@/utils/company-normalization';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getExtFromContentType(ct: string | null) {
  const v = (ct || '').toLowerCase();
  if (v.includes('image/webp')) return 'webp';
  if (v.includes('image/png')) return 'png';
  if (v.includes('image/jpeg') || v.includes('image/jpg')) return 'jpg';
  if (v.includes('image/gif')) return 'gif';
  return '';
}

function resolveFrontendPublicDir() {
  const cwd = process.cwd();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');

  const isFrontendAppRoot = (dir: string) =>
    fs.existsSync(path.join(dir, 'src', 'app')) && fs.existsSync(path.join(dir, 'next.config.js'));

  if (isFrontendAppRoot(cwd)) return path.join(cwd, 'public');

  const nxFrontend = path.join(cwd, 'apps', 'frontend');
  if (isFrontendAppRoot(nxFrontend)) return path.join(nxFrontend, 'public');

  let dir = cwd;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, 'apps', 'frontend');
    if (isFrontendAppRoot(candidate)) return path.join(candidate, 'public');
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return path.join(cwd, 'apps', 'frontend', 'public');
}

function inferTenantFromHost(hostHeader: string | null): string {
  if (!hostHeader) return '';
  const host = hostHeader.split(':')[0].toLowerCase();
  if (!host) return '';
  if (host === 'localhost' || host === '127.0.0.1') return '';
  const parts = host.split('.').filter(Boolean);
  if (parts.length >= 2) {
    const candidate = parts[0];
    if (candidate && candidate !== 'www') return candidate;
  }
  return '';
}

function inferTenantFromReferer(referer: string | null): string {
  if (!referer) return '';
  try {
    const u = new URL(referer);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] === 's' && parts[1]) return parts[1];
  } catch {
    // ignore
  }
  return '';
}

function resolveTenantKey(req: NextRequest, url: URL) {
  const headerTenant =
    req.headers.get('x-tenant-id') ||
    req.headers.get('x-tenant') ||
    req.headers.get('x-company') ||
    '';

  const fromQuery = url.searchParams.get('tenantId') || '';
  const fromHost = inferTenantFromHost(req.headers.get('host'));
  const fromReferer = inferTenantFromReferer(req.headers.get('referer'));

  return safeName(fromQuery || headerTenant || fromHost || fromReferer || 'default');
}

function resolveUploadProvider(): 'local' | 'vercel_blob' {
  const raw = (process.env.UPLOAD_PROVIDER || '').trim().toLowerCase();

  // Modo explícito (recomendado)
  if (raw === 'local') return 'local';
  if (raw === 'vercel_blob' || raw === 'blob' || raw === 'vercel') return 'vercel_blob';

  // Auto-detect si no lo configuran:
  // En Vercel => usar blob SOLO si existe token.
  const isVercel = process.env.VERCEL === '1';
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  if (isVercel && hasBlobToken) return 'vercel_blob';

  return 'local';
}

export const POST = auth(async function POST(req: NextRequest) {
  try {
    const session = (req as any).auth;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    if (role !== 'AUCTION_MANAGER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const filenameParam = url.searchParams.get('filename') || 'upload';
    const tenantId = resolveTenantKey(req, url);

    // Asegura que solo pueda subir a su tenant/empresa
    const userCompany = normalizeCompanyName(session.user.company?.name ?? '');
    if (!userCompany || normalizeCompanyName(tenantId) !== userCompany) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isMultipart =
      contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded');

    let fileBytes: Buffer;
    let finalContentType = 'application/octet-stream';
    let originalName = filenameParam;

    if (isMultipart) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'Missing file field "file"' }, { status: 400 });
      originalName = file.name || filenameParam;
      finalContentType = file.type || finalContentType;
      fileBytes = Buffer.from(await file.arrayBuffer());
    } else {
      finalContentType = (req.headers.get('content-type') || finalContentType).split(';')[0];
      fileBytes = Buffer.from(await req.arrayBuffer());
    }

    // 20MB
    const maxBytes = 20 * 1024 * 1024;
    if (fileBytes.byteLength > maxBytes) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 413 });
    }

    const safeOriginal = safeName(originalName);
    const baseName = safeOriginal.replace(/\.[^.]+$/, '') || 'image';
    const extFromNameMatch = safeOriginal.match(/\.([a-zA-Z0-9]+)$/);
    const extFromName = extFromNameMatch ? extFromNameMatch[1].toLowerCase() : '';
    const ext = extFromName || getExtFromContentType(finalContentType) || 'bin';

    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const outFileName = `${baseName}-${id}.${ext}`;

    const provider = resolveUploadProvider();

    if (provider === 'vercel_blob') {
      // En Vercel esto es obligatorio; si falta, preferimos fallar explícitamente.
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          { error: 'UPLOAD_PROVIDER=vercel_blob requires BLOB_READ_WRITE_TOKEN' },
          { status: 500 }
        );
      }

      const key = `uploads/${tenantId}/images/${outFileName}`;

      // @vercel/blob espera Uint8Array / ArrayBuffer
      const blob = await put(key, new Uint8Array(fileBytes), {
        access: 'public',
        contentType: finalContentType,
      });

      return NextResponse.json(
        {
          ok: true,
          provider: 'vercel_blob',
          key,
          url: blob.url,
          contentType: finalContentType,
          size: fileBytes.byteLength,
        },
        { status: 200 }
      );
    }

    // Local (dev / local explícito)
    const publicDir = resolveFrontendPublicDir();
    const outDir = path.join(publicDir, 'uploads', tenantId, 'images');
    await mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, outFileName);
    await writeFile(outPath, fileBytes);

    const publicUrl = `/uploads/${tenantId}/images/${outFileName}`;
    return NextResponse.json(
      {
        ok: true,
        provider: 'local',
        url: publicUrl,
        contentType: finalContentType,
        size: fileBytes.byteLength,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error uploading file:', err);
    return NextResponse.json({ error: 'Upload failed', details: err?.message ?? String(err) }, { status: 500 });
  }
});
