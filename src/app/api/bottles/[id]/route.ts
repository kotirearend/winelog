import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bottles } from '@/lib/schema';
import { bottleUpdateSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);

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

    return NextResponse.json(bottle[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get bottle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = bottleUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
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

    const {
      name,
      producer,
      vintage,
      grapes,
      country,
      region,
      status,
      locationId,
      purchaseDate,
      purchaseSourceType,
      purchaseSourceName,
      priceAmount,
      priceCurrency,
      subLocationText,
      quantity,
      photoUrl,
      notesShort,
      notesLong,
      tags,
    } = result.data;

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (producer !== undefined) updateData.producer = producer;
    if (vintage !== undefined) updateData.vintage = vintage;
    if (grapes !== undefined) updateData.grapes = grapes;
    if (country !== undefined) updateData.country = country;
    if (region !== undefined) updateData.region = region;
    if (status !== undefined) updateData.status = status;
    if (locationId !== undefined) updateData.locationId = locationId || null;
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate;
    if (purchaseSourceType !== undefined)
      updateData.purchaseSourceType = purchaseSourceType;
    if (purchaseSourceName !== undefined)
      updateData.purchaseSourceName = purchaseSourceName;
    if (priceAmount !== undefined)
      updateData.priceAmount = priceAmount ? String(priceAmount) : null;
    if (priceCurrency !== undefined) updateData.priceCurrency = priceCurrency;
    if (subLocationText !== undefined)
      updateData.subLocationText = subLocationText;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (notesShort !== undefined) updateData.notesShort = notesShort;
    if (notesLong !== undefined) updateData.notesLong = notesLong;
    if (tags !== undefined) updateData.tags = tags;

    const updatedBottle = await db
      .update(bottles)
      .set(updateData)
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
    console.error('Update bottle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
