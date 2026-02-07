import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getAuthUser } from '@/lib/auth';

const SPACES_BUCKET = process.env.SPACES_BUCKET || 'winelogv1';
const SPACES_REGION = process.env.SPACES_REGION || 'lon1';
const SPACES_ENDPOINT = `https://${SPACES_REGION}.digitaloceanspaces.com`;
const SPACES_CDN_URL = process.env.SPACES_CDN_URL || `https://${SPACES_BUCKET}.${SPACES_REGION}.digitaloceanspaces.com`;

const s3 = new S3Client({
  endpoint: SPACES_ENDPOINT,
  region: SPACES_REGION,
  credentials: {
    accessKeyId: process.env.SPACES_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET || '',
  },
  forcePathStyle: false,
});

export async function POST(request: Request) {
  try {
    await getAuthUser(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 10MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const key = `uploads/${filename}`;

    // Upload to DO Spaces
    const bytes = await file.arrayBuffer();
    await s3.send(
      new PutObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: key,
        Body: Buffer.from(bytes),
        ContentType: file.type,
        ACL: 'public-read',
      })
    );

    // Return the public Spaces URL directly
    const photoUrl = `${SPACES_CDN_URL}/${key}`;

    return NextResponse.json({ photoUrl, filename });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
