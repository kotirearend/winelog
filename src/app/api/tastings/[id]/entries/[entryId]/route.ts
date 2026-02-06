import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions, tastingEntries } from '@/lib/schema';
import { tastingEntryScoreSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = tastingEntryScoreSchema.safeParse(body);

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

    // Verify entry belongs to this session
    const entry = await db
      .select()
      .from(tastingEntries)
      .where(
        and(
          eq(tastingEntries.id, params.entryId),
          eq(tastingEntries.tastingSessionId, params.id)
        )
      );

    if (entry.length === 0) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const {
      appearanceScore,
      noseScore,
      palateScore,
      finishScore,
      balanceScore,
      notesShort,
      notesLong,
      tags,
    } = result.data;

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (appearanceScore !== undefined)
      updateData.appearanceScore = appearanceScore;
    if (noseScore !== undefined) updateData.noseScore = noseScore;
    if (palateScore !== undefined) updateData.palateScore = palateScore;
    if (finishScore !== undefined) updateData.finishScore = finishScore;
    if (balanceScore !== undefined) updateData.balanceScore = balanceScore;

    // Compute totalScore server-side if all 5 scores are provided
    const allScores = [appearanceScore, noseScore, palateScore, finishScore, balanceScore];
    if (allScores.every(score => score !== undefined && score !== null)) {
      updateData.totalScore = allScores.reduce((sum, score) => sum + score, 0);
    }

    if (notesShort !== undefined) updateData.notesShort = notesShort;
    if (notesLong !== undefined) updateData.notesLong = notesLong;
    if (tags !== undefined) updateData.tags = tags;

    const updatedEntry = await db
      .update(tastingEntries)
      .set(updateData)
      .where(eq(tastingEntries.id, params.entryId))
      .returning();

    return NextResponse.json(updatedEntry[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Update tasting entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const authUser = await getAuthUser(request);

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

    // Verify entry belongs to this session
    const entry = await db
      .select()
      .from(tastingEntries)
      .where(
        and(
          eq(tastingEntries.id, params.entryId),
          eq(tastingEntries.tastingSessionId, params.id)
        )
      );

    if (entry.length === 0) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    await db
      .delete(tastingEntries)
      .where(eq(tastingEntries.id, params.entryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Delete tasting entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
