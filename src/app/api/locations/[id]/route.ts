import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { locations } from '@/lib/schema';
import { locationSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = locationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name } = result.data;

    // Verify ownership
    const location = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.id, id),
          eq(locations.userId, authUser.userId)
        )
      );

    if (location.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const updatedLocation = await db
      .update(locations)
      .set({ name, updatedAt: new Date() })
      .where(eq(locations.id, id))
      .returning();

    return NextResponse.json(updatedLocation[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Update location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
