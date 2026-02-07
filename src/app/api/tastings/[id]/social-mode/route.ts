import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions } from '@/lib/schema';
import { socialModeToggleSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = socialModeToggleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const session = await db
      .select()
      .from(tastingSessions)
      .where(
        and(
          eq(tastingSessions.id, id),
          eq(tastingSessions.userId, authUser.userId)
        )
      );

    if (session.length === 0) {
      return NextResponse.json(
        { error: 'Tasting session not found' },
        { status: 404 }
      );
    }

    const { enabled } = result.data;

    const updateData: Record<string, any> = {
      isSocialMode: enabled,
      updatedAt: new Date(),
    };

    if (enabled) {
      // Generate session code if not already set
      if (!session[0].sessionCode) {
        updateData.sessionCode = generateSessionCode();
      }
      // Set/reset invite expiry to 24h from now
      updateData.inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const updatedSession = await db
      .update(tastingSessions)
      .set(updateData)
      .where(eq(tastingSessions.id, id))
      .returning();

    return NextResponse.json(updatedSession[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Toggle social mode error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
