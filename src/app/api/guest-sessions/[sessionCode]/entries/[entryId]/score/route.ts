import { NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions, tastingEntries } from '@/lib/schema';
import { tastingEntryScoreSchema } from '@/lib/validations';
import { getAuthGuest } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionCode: string; entryId: string }> }
) {
  try {
    const { sessionCode, entryId } = await params;
    const guest = await getAuthGuest(request);

    // Verify the guest token matches this session code
    if (guest.sessionCode !== sessionCode.toUpperCase()) {
      return NextResponse.json(
        { error: 'Unauthorized for this session' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = tastingEntryScoreSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Find the session
    const session = await db
      .select()
      .from(tastingSessions)
      .where(eq(tastingSessions.sessionCode, sessionCode.toUpperCase()));

    if (session.length === 0 || !session[0].isSocialMode) {
      return NextResponse.json(
        { error: 'Session not found or not in social mode' },
        { status: 404 }
      );
    }

    // Verify the parent entry exists and is a host entry
    const parentEntry = await db
      .select()
      .from(tastingEntries)
      .where(
        and(
          eq(tastingEntries.id, entryId),
          eq(tastingEntries.tastingSessionId, session[0].id),
          isNull(tastingEntries.guestId)
        )
      );

    if (parentEntry.length === 0) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Check if guest already scored this entry
    const existingEntry = await db
      .select()
      .from(tastingEntries)
      .where(
        and(
          eq(tastingEntries.tastingSessionId, session[0].id),
          eq(tastingEntries.guestId, guest.guestId),
          eq(tastingEntries.parentEntryId, entryId)
        )
      );

    const {
      totalScore,
      tastingNotes,
      notesShort,
      notesLong,
      tags,
    } = result.data;

    if (existingEntry.length > 0) {
      // Update existing guest entry
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };
      if (totalScore !== undefined) updateData.totalScore = totalScore;
      if (tastingNotes !== undefined) updateData.tastingNotes = tastingNotes;
      if (notesShort !== undefined) updateData.notesShort = notesShort;
      if (notesLong !== undefined) updateData.notesLong = notesLong;
      if (tags !== undefined) updateData.tags = tags;

      const updated = await db
        .update(tastingEntries)
        .set(updateData)
        .where(eq(tastingEntries.id, existingEntry[0].id))
        .returning();

      return NextResponse.json(updated[0]);
    }

    // Create new guest entry linked to the parent
    const pe = parentEntry[0];
    const newEntry = await db
      .insert(tastingEntries)
      .values({
        tastingSessionId: session[0].id,
        bottleId: pe.bottleId,
        adHocName: pe.adHocName,
        adHocPhotoUrl: pe.adHocPhotoUrl,
        guestId: guest.guestId,
        guestName: guest.guestName,
        parentEntryId: entryId,
        totalScore: totalScore || null,
        tastingNotes: tastingNotes || null,
        notesShort: notesShort || null,
        notesLong: notesLong || null,
        tags: tags || null,
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
    if (error instanceof Error && error.message.includes('guest token')) {
      return NextResponse.json(
        { error: 'Invalid guest token' },
        { status: 401 }
      );
    }
    console.error('Guest score entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
