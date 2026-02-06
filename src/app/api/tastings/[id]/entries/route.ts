import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions, tastingEntries, bottles } from '@/lib/schema';
import { tastingEntryCreateSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = tastingEntryCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const session = await db
      .select()
      .from(tastingSessions)
      .where(
        and(
          eq(tastingSessions.id, params.id),
          eq(tastingSessions.userId, authUser.userId)
        )
      );

    if (session.length === 0) {
      return NextResponse.json(
        { error: 'Tasting session not found' },
        { status: 404 }
      );
    }

    const { bottleId, adHocName, adHocPhotoUrl, saveToCellar } = result.data;

    // If bottleId provided, verify it belongs to user
    if (bottleId) {
      const bottle = await db
        .select()
        .from(bottles)
        .where(
          and(
            eq(bottles.id, bottleId),
            eq(bottles.userId, authUser.userId)
          )
        );

      if (bottle.length === 0) {
        return NextResponse.json(
          { error: 'Bottle not found or unauthorized' },
          { status: 404 }
        );
      }
    }

    const newEntry = await db
      .insert(tastingEntries)
      .values({
        tastingSessionId: params.id,
        bottleId: bottleId || null,
        adHocName: adHocName || null,
        adHocPhotoUrl: adHocPhotoUrl || null,
        saveToCellar: saveToCellar || false,
      })
      .returning();

    return NextResponse.json(newEntry[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Create tasting entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
