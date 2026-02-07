import { NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions, tastingEntries, tastingSessionGuests, bottles } from '@/lib/schema';
import { getAuthGuest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionCode: string }> }
) {
  try {
    const { sessionCode } = await params;
    const guest = await getAuthGuest(request);

    // Verify the guest token matches this session code
    if (guest.sessionCode !== sessionCode.toUpperCase()) {
      return NextResponse.json(
        { error: 'Unauthorized for this session' },
        { status: 403 }
      );
    }

    // Find the session
    const session = await db
      .select()
      .from(tastingSessions)
      .where(eq(tastingSessions.sessionCode, sessionCode.toUpperCase()));

    if (session.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sess = session[0];

    // Get the host's template entries (entries where guest_id is null)
    const hostEntries = await db
      .select({
        id: tastingEntries.id,
        adHocName: tastingEntries.adHocName,
        adHocPhotoUrl: tastingEntries.adHocPhotoUrl,
        bottleId: tastingEntries.bottleId,
        bottleName: bottles.name,
        bottleProducer: bottles.producer,
        bottleVintage: bottles.vintage,
        bottlePhotoUrl: bottles.photoUrl,
        entryPhotoUrl: tastingEntries.entryPhotoUrl,
      })
      .from(tastingEntries)
      .leftJoin(bottles, eq(tastingEntries.bottleId, bottles.id))
      .where(
        and(
          eq(tastingEntries.tastingSessionId, sess.id),
          isNull(tastingEntries.guestId)
        )
      );

    // Get this guest's scored entries
    const guestEntries = await db
      .select()
      .from(tastingEntries)
      .where(
        and(
          eq(tastingEntries.tastingSessionId, sess.id),
          eq(tastingEntries.guestId, guest.guestId)
        )
      );

    // Get all guests for this session
    const guests = await db
      .select({
        id: tastingSessionGuests.id,
        guestName: tastingSessionGuests.guestName,
        joinedAt: tastingSessionGuests.joinedAt,
      })
      .from(tastingSessionGuests)
      .where(eq(tastingSessionGuests.tastingSessionId, sess.id));

    // Get all guest entries for comparison
    const allGuestEntries = await db
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
      .where(eq(tastingEntries.tastingSessionId, sess.id));

    return NextResponse.json({
      session: {
        id: sess.id,
        name: sess.name,
        venue: sess.venue,
        tastedAt: sess.tastedAt,
      },
      hostEntries,
      myEntries: guestEntries,
      guests,
      allEntries: allGuestEntries,
    });
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
    console.error('Get guest session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
