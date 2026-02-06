import { NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bottles, drinkLogs } from '@/lib/schema';
import { drinkLogCreateSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);

    // Verify the bottle belongs to the authenticated user
    const bottle = await db
      .select()
      .from(bottles)
      .where(
        and(
          eq(bottles.id, id),
          eq(bottles.userId, authUser.userId)
        )
      );

    if (bottle.length === 0) {
      return NextResponse.json(
        { error: 'Bottle not found' },
        { status: 404 }
      );
    }

    // Get all drink logs for this bottle
    const logs = await db
      .select()
      .from(drinkLogs)
      .where(eq(drinkLogs.bottleId, id))
      .orderBy(desc(drinkLogs.drankAt));

    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get drink logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const body = await request.json();

    // Validate request body
    const result = drinkLogCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify the bottle belongs to the authenticated user
    const bottle = await db
      .select()
      .from(bottles)
      .where(
        and(
          eq(bottles.id, id),
          eq(bottles.userId, authUser.userId)
        )
      );

    if (bottle.length === 0) {
      return NextResponse.json(
        { error: 'Bottle not found' },
        { status: 404 }
      );
    }

    const { drankAt, context, venue, rating, tastingNotes, notes } = result.data;

    // Parse drankAt if provided, otherwise use current time
    const parsedDrankAt = drankAt ? new Date(drankAt) : new Date();

    // Insert the drink log
    const newDrinkLog = await db
      .insert(drinkLogs)
      .values({
        userId: authUser.userId,
        bottleId: id,
        drankAt: parsedDrankAt,
        context: context || null,
        venue: venue || null,
        rating: rating || null,
        tastingNotes: tastingNotes || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(newDrinkLog[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Create drink log error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
