import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tastingSessions, tastingEntries, bottles, locations } from '@/lib/schema';
import { saveToCellarSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params;
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = saveToCellarSchema.safeParse(body);

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

    // Get entry
    const entryResult = await db
      .select()
      .from(tastingEntries)
      .where(
        and(
          eq(tastingEntries.id, entryId),
          eq(tastingEntries.tastingSessionId, id)
        )
      );

    if (entryResult.length === 0) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const entry = entryResult[0];

    // Verify entry has adHocName
    if (!entry.adHocName) {
      return NextResponse.json(
        { error: 'Entry must have an ad hoc name to save to cellar' },
        { status: 400 }
      );
    }

    const { locationId, subLocationText, quantity } = result.data;

    // Verify locationId belongs to user
    const location = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.id, locationId),
          eq(locations.userId, authUser.userId)
        )
      );

    if (location.length === 0) {
      return NextResponse.json(
        { error: 'Location not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create new bottle from entry's ad hoc data
    const newBottle = await db
      .insert(bottles)
      .values({
        userId: authUser.userId,
        name: entry.adHocName,
        photoUrl: entry.adHocPhotoUrl || null,
        locationId,
        subLocationText: subLocationText || null,
        quantity: quantity || 1,
      })
      .returning();

    // Update entry to link to new bottle and set saveToCellar=true
    const updatedEntry = await db
      .update(tastingEntries)
      .set({
        bottleId: newBottle[0].id,
        saveToCellar: true,
        updatedAt: new Date(),
      })
      .where(eq(tastingEntries.id, entryId))
      .returning();

    return NextResponse.json({
      bottle: newBottle[0],
      entry: updatedEntry[0],
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Save to cellar error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
