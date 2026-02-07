import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getAuthUser } from '@/lib/auth';

// Check if DO Spaces is configured
const spacesConfigured = !!(process.env.SPACES_KEY && process.env.SPACES_SECRET);

async function uploadToSpaces(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const bucket = process.env.SPACES_BUCKET || 'winelogv1';
  const region = process.env.SPACES_REGION || 'lon1';
  const cdnUrl = process.env.SPACES_CDN_URL || `https://${bucket}.${region}.digitaloceanspaces.com`;

  const s3 = new S3Client({
    endpoint: `https://${region}.digitaloceanspaces.com`,
    region,
    credentials: {
      accessKeyId: process.env.SPACES_KEY!,
      secretAccessKey: process.env.SPACES_SECRET!,
    },
    forcePathStyle: false,
  });

  const key = `uploads/${filename}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    })
  );

  return `${cdnUrl}/${key}`;
}

async function uploadToLocal(buffer: Buffer, filename: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);
  // Use API route to serve — standalone mode won't serve runtime static files
  return `/api/uploads/${filename}`;
}

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let photoUrl: string;

    if (spacesConfigured) {
      photoUrl = await uploadToSpaces(buffer, filename, file.type);
    } else {
      // Fallback: store locally in public/uploads
      console.warn('DO Spaces not configured — saving image locally');
      photoUrl = await uploadToLocal(buffer, filename);
    }

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
      { error: 'Upload failed', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
