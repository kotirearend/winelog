import { NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions, tastingEntries, tastingSessionGuests, bottles } from '@/lib/schema';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);

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

    // Get host's template entries with bottle details
    const hostEntries = await db
      .select({
        id: tastingEntries.id,
        adHocName: tastingEntries.adHocName,
        adHocPhotoUrl: tastingEntries.adHocPhotoUrl,
        bottleId: tastingEntries.bottleId,
        totalScore: tastingEntries.totalScore,
        tastingNotes: tastingEntries.tastingNotes,
        notesShort: tastingEntries.notesShort,
        bottleName: bottles.name,
        bottleProducer: bottles.producer,
        bottleVintage: bottles.vintage,
        bottlePhotoUrl: bottles.photoUrl,
      })
      .from(tastingEntries)
      .leftJoin(bottles, eq(tastingEntries.bottleId, bottles.id))
      .where(
        and(
          eq(tastingEntries.tastingSessionId, id),
          isNull(tastingEntries.guestId)
        )
      );

    // Get all guest entries
    const guestEntries = await db
      .select({
        id: tastingEntries.id,
        guestId: tastingEntries.guestId,
        guestName: tastingEntries.guestName,
        parentEntryId: tastingEntries.parentEntryId,
        totalScore: tastingEntries.totalScore,
        tastingNotes: tastingEntries.tastingNotes,
        notesShort: tastingEntries.notesShort,
      })
      .from(tastingEntries)
      .where(
        and(
          eq(tastingEntries.tastingSessionId, id),
          // Guest entries have a guestId set
        )
      );

    // Filter to only guest entries (exclude host entries)
    const guestOnlyEntries = guestEntries.filter((e) => e.guestId !== null);

    // Get all guests
    const guests = await db
      .select({
        id: tastingSessionGuests.id,
        guestName: tastingSessionGuests.guestName,
        joinedAt: tastingSessionGuests.joinedAt,
        isActive: tastingSessionGuests.isActive,
      })
      .from(tastingSessionGuests)
      .where(eq(tastingSessionGuests.tastingSessionId, id));

    // Build comparison data: for each wine, show host + all guest scores
    const comparison = hostEntries.map((hostEntry) => {
      const wineName = hostEntry.adHocName || hostEntry.bottleName || 'Unknown';
      const guestScores = guestOnlyEntries
        .filter((ge) => ge.parentEntryId === hostEntry.id)
        .map((ge) => ({
          guestId: ge.guestId,
          guestName: ge.guestName,
          totalScore: ge.totalScore,
          notesShort: ge.notesShort,
          tastingNotes: ge.tastingNotes,
        }));

      return {
        entryId: hostEntry.id,
        wineName,
        producer: hostEntry.bottleProducer,
        vintage: hostEntry.bottleVintage,
        photoUrl: hostEntry.adHocPhotoUrl || hostEntry.bottlePhotoUrl,
        hostScore: hostEntry.totalScore,
        hostNotes: hostEntry.notesShort,
        guestScores,
      };
    });

    return NextResponse.json({
      session: session[0],
      guests,
      comparison,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get social results error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
