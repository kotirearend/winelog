import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions, tastingEntries, bottles } from '@/lib/schema';
import { tastingUpdateSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);

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

    // Get entries with bottle details
    const entries = await db
      .select({
        id: tastingEntries.id,
        tastingSessionId: tastingEntries.tastingSessionId,
        bottleId: tastingEntries.bottleId,
        adHocName: tastingEntries.adHocName,
        adHocPhotoUrl: tastingEntries.adHocPhotoUrl,
        saveToCellar: tastingEntries.saveToCellar,
        appearanceScore: tastingEntries.appearanceScore,
        noseScore: tastingEntries.noseScore,
        palateScore: tastingEntries.palateScore,
        finishScore: tastingEntries.finishScore,
        balanceScore: tastingEntries.balanceScore,
        totalScore: tastingEntries.totalScore,
        tastingNotes: tastingEntries.tastingNotes,
        notesShort: tastingEntries.notesShort,
        notesLong: tastingEntries.notesLong,
        tags: tastingEntries.tags,
        createdAt: tastingEntries.createdAt,
        updatedAt: tastingEntries.updatedAt,
        bottleName: bottles.name,
        bottleProducer: bottles.producer,
        bottleVintage: bottles.vintage,
        bottlePhotoUrl: bottles.photoUrl,
      })
      .from(tastingEntries)
      .leftJoin(bottles, eq(tastingEntries.bottleId, bottles.id))
      .where(eq(tastingEntries.tastingSessionId, id));

    return NextResponse.json({
      ...session[0],
      entries,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get tasting error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = tastingUpdateSchema.safeParse(body);

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

    const { name, tastedAt, venue, participants, notes, summary } = result.data;

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (tastedAt !== undefined) updateData.tastedAt = new Date(tastedAt);
    if (venue !== undefined) updateData.venue = venue;
    if (participants !== undefined) updateData.participants = participants;
    if (notes !== undefined) updateData.notes = notes;
    if (summary !== undefined) updateData.summary = summary;

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
    console.error('Update tasting error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
