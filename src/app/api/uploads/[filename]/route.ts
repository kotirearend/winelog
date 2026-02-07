import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const spacesConfigured = !!(process.env.SPACES_KEY && process.env.SPACES_SECRET);
const SPACES_BUCKET = process.env.SPACES_BUCKET || 'winelogv1';
const SPACES_REGION = process.env.SPACES_REGION || 'lon1';
const SPACES_CDN_URL = process.env.SPACES_CDN_URL || `https://${SPACES_BUCKET}.${SPACES_REGION}.digitaloceanspaces.com`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (spacesConfigured) {
      // Redirect to DO Spaces
      const spacesUrl = `${SPACES_CDN_URL}/uploads/${filename}`;
      return NextResponse.redirect(spacesUrl, 301);
    }

    // Serve from local filesystem
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    const buffer = await readFile(filePath);

    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType =
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      ext === 'gif' ? 'image/gif' :
      'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Serve file error:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}
