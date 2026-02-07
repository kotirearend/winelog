import { NextResponse } from 'next/server';
import { eq, desc, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions, tastingEntries } from '@/lib/schema';
import { tastingCreateSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    const sessions = await db
      .select()
      .from(tastingSessions)
      .where(eq(tastingSessions.userId, authUser.userId))
      .orderBy(desc(tastingSessions.tastedAt));

    // Fetch entries for all sessions to get counts and top scores
    const sessionIds = sessions.map(s => s.id);
    let allEntries: { tastingSessionId: string; totalScore: number | null }[] = [];
    if (sessionIds.length > 0) {
      allEntries = await db
        .select({
          tastingSessionId: tastingEntries.tastingSessionId,
          totalScore: tastingEntries.totalScore,
        })
        .from(tastingEntries)
        .where(isNull(tastingEntries.guestId)); // Only host entries, not guest entries
    }

    // Group entries by session
    const entriesBySession = new Map<string, { totalScore: number | null }[]>();
    for (const entry of allEntries) {
      const existing = entriesBySession.get(entry.tastingSessionId) || [];
      existing.push({ totalScore: entry.totalScore });
      entriesBySession.set(entry.tastingSessionId, existing);
    }

    // Attach entries to sessions
    const sessionsWithEntries = sessions.map(session => ({
      ...session,
      entries: (entriesBySession.get(session.id) || []).map(e => ({
        id: session.id,
        score: e.totalScore,
      })),
    }));

    return NextResponse.json(sessionsWithEntries);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get tastings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = tastingCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, tastedAt, venue, participants, notes } = result.data;

    const newSession = await db
      .insert(tastingSessions)
      .values({
        userId: authUser.userId,
        name,
        tastedAt: tastedAt ? new Date(tastedAt) : new Date(),
        venue: venue || null,
        participants: participants || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(newSession[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Create tasting error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
