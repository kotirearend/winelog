import { NextResponse } from 'next/server';

const SPACES_BUCKET = process.env.SPACES_BUCKET || 'winelogv1';
const SPACES_REGION = process.env.SPACES_REGION || 'lon1';
const SPACES_CDN_URL = process.env.SPACES_CDN_URL || `https://${SPACES_BUCKET}.${SPACES_REGION}.digitaloceanspaces.com`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Redirect to DO Spaces URL for any legacy /api/uploads/filename requests
    const spacesUrl = `${SPACES_CDN_URL}/uploads/${filename}`;
    return NextResponse.redirect(spacesUrl, 301);
  } catch (error) {
    console.error('Serve file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
