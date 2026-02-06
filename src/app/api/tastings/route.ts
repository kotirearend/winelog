import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions } from '@/lib/schema';
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

    return NextResponse.json(sessions);
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
