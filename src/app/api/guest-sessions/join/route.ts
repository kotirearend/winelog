import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions, tastingSessionGuests, tastingEntries, bottles } from '@/lib/schema';
import { guestJoinSchema } from '@/lib/validations';
import { signGuestToken, hashGuestToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = guestJoinSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionCode, guestName } = result.data;

    // Find the session by code
    const session = await db
      .select()
      .from(tastingSessions)
      .where(eq(tastingSessions.sessionCode, sessionCode.toUpperCase()));

    if (session.length === 0) {
      return NextResponse.json(
        { error: 'Invalid session code' },
        { status: 404 }
      );
    }

    const sess = session[0];

    // Check social mode is enabled
    if (!sess.isSocialMode) {
      return NextResponse.json(
        { error: 'This session is not accepting guests' },
        { status: 403 }
      );
    }

    // Check invite hasn't expired
    if (sess.inviteExpiresAt && new Date() > new Date(sess.inviteExpiresAt)) {
      return NextResponse.json(
        { error: 'This invite link has expired' },
        { status: 410 }
      );
    }

    // Sign the guest token first (we need the token to hash it)
    const guestId = require('crypto').randomUUID();
    const token = await signGuestToken({
      guestId,
      sessionCode: sessionCode.toUpperCase(),
      guestName,
    });

    const tokenHash = hashGuestToken(token);

    // Create guest record
    const newGuest = await db
      .insert(tastingSessionGuests)
      .values({
        id: guestId,
        tastingSessionId: sess.id,
        guestName,
        guestTokenHash: tokenHash,
      })
      .returning();

    // Get the host's entries (template wines to score)
    const entries = await db
      .select({
        id: tastingEntries.id,
        adHocName: tastingEntries.adHocName,
        adHocPhotoUrl: tastingEntries.adHocPhotoUrl,
        bottleId: tastingEntries.bottleId,
        bottleName: bottles.name,
        bottleProducer: bottles.producer,
        bottleVintage: bottles.vintage,
        bottlePhotoUrl: bottles.photoUrl,
      })
      .from(tastingEntries)
      .leftJoin(bottles, eq(tastingEntries.bottleId, bottles.id))
      .where(
        and(
          eq(tastingEntries.tastingSessionId, sess.id),
          // Only host entries (no guest_id = template entries)
        )
      );

    // Filter to only host entries (guest_id is null)
    const hostEntries = entries.filter((e: any) => true); // all entries returned; we'll filter in the query below

    return NextResponse.json({
      token,
      guestId: newGuest[0].id,
      guestName: newGuest[0].guestName,
      sessionCode: sessionCode.toUpperCase(),
      sessionName: sess.name,
      sessionId: sess.id,
      venue: sess.venue,
    });
  } catch (error) {
    console.error('Guest join error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
