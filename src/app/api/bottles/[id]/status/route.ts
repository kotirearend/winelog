import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bottles } from '@/lib/schema';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['in_cellar', 'consumed', 'archived']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const body = await request.json();

    // Validate request body
    const result = statusSchema.safeParse(body);

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

    // Update the bottle status
    const updatedBottle = await db
      .update(bottles)
      .set({
        status: result.data.status,
        updatedAt: new Date(),
      })
      .where(eq(bottles.id, id))
      .returning();

    return NextResponse.json(updatedBottle[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Update bottle status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
