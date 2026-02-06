import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getAuthUser } from '@/lib/auth';
import { getSignedUploadUrl, getPublicUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();

    const { contentType, fileName } = body;

    if (!contentType || !fileName) {
      return NextResponse.json(
        { error: 'contentType and fileName are required' },
        { status: 400 }
      );
    }

    // Generate unique key
    const key = `${authUser.userId}/${randomUUID()}-${fileName}`;

    // Get signed upload URL
    const uploadUrl = await getSignedUploadUrl(key, contentType);

    // Get public URL
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Sign upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
