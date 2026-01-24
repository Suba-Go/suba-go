import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import crypto from 'crypto';
import { auth } from '@/auth';
import { normalizeCompanyName } from '@/utils/company-normalization';

// Ensure Node runtime so fs works (Nx/Next App Router)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeName(name: string) {
  return name
    .normalize('NFKD')
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
  // In Nx monorepo, `process.cwd()` is not stable:
  // - Sometimes it's the workspace root
  // - Sometimes it's apps/frontend
  //
  // Next serves static files from the *Next app's* `public/` directory.
  // So we resolve the app root first, then return `<appRoot>/public`.
  const cwd = process.cwd();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');

  const isFrontendAppRoot = (dir: string) => {
    return (
      fs.existsSync(path.join(dir, 'src', 'app')) &&
      fs.existsSync(path.join(dir, 'next.config.js'))
    );
  };

  // Case 1: we are already inside apps/frontend
  if (isFrontendAppRoot(cwd)) return path.join(cwd, 'public');

  // Case 2: we are in workspace root
  const nxFrontend = path.join(cwd, 'apps', 'frontend');
  if (isFrontendAppRoot(nxFrontend)) return path.join(nxFrontend, 'public');

  // Case 3: walk up to find workspace root and then apps/frontend
  let dir = cwd;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, 'apps', 'frontend');
    if (isFrontendAppRoot(candidate)) return path.join(candidate, 'public');
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Last resort: try closest `public` folder.
  let dir2 = cwd;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir2, 'public');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir2);
    if (parent === dir2) break;
    dir2 = parent;
  }

  return path.join(cwd, 'apps', 'frontend', 'public');
}

function inferTenantFromHost(hostHeader: string | null): string {
  if (!hostHeader) return '';
  const host = hostHeader.split(':')[0].toLowerCase();
  if (!host) return '';

  // Common local cases
  if (host === 'localhost' || host === '127.0.0.1') return '';

  // If using something like tenant.localhost or tenant.domain.com
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
    // Our multi-tenant routing is /s/[subdomain]/...
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

export const POST = auth(async function POST(req: NextRequest) {
  try {
    const session = (req as any).auth;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers/admins can upload media to the tenant public bucket.
    const role = session.user.role;
    if (role !== 'AUCTION_MANAGER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const filenameParam = url.searchParams.get('filename') || 'upload';
    const tenantId = resolveTenantKey(req, url);

    // Ensure the upload tenant matches the authenticated user's company.
    const userCompany = normalizeCompanyName(session.user.company?.name ?? '');
    if (!userCompany || normalizeCompanyName(tenantId) !== userCompany) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isMultipart =
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded');

    let fileBytes: Buffer;
    let finalContentType = 'application/octet-stream';
    let originalName = filenameParam;

    if (isMultipart) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const tenantFromForm = formData.get('tenantId');
      if (typeof tenantFromForm === 'string' && tenantFromForm.trim()) {
        // allow tenant override if provided
        // but keep safe
      }
      if (!file) {
        return NextResponse.json({ error: 'Missing file field "file"' }, { status: 400 });
      }
      originalName = file.name || filenameParam;
      finalContentType = file.type || finalContentType;
      const ab = await file.arrayBuffer();
      fileBytes = Buffer.from(ab);
    } else {
      // Many clients send raw File/Blob as body (content-type image/*)
      finalContentType = (req.headers.get('content-type') || finalContentType).split(';')[0];
      const ab = await req.arrayBuffer();
      fileBytes = Buffer.from(ab);
    }

    // Size guard (20MB)
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

    const publicDir = resolveFrontendPublicDir();
    const outDir = path.join(publicDir, 'uploads', tenantId, 'images');
    await mkdir(outDir, { recursive: true });

    const outPath = path.join(outDir, outFileName);
    await writeFile(outPath, fileBytes);

    // Dev aid: if this ever returns 404, this log tells us where the file was written.
    // eslint-disable-next-line no-console
    console.log('[upload] saved', { publicDir, outPath, publicUrl: `/uploads/${tenantId}/images/${outFileName}` });

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
    return NextResponse.json(
      { error: 'Upload failed', details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
});
