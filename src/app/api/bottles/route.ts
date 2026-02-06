import { NextResponse } from 'next/server';
import { eq, and, desc, gt, ilike } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bottles, locations } from '@/lib/schema';
import { bottleCreateSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    const { searchParams } = new URL(request.url);

    const locationId = searchParams.get('locationId');
    const q = searchParams.get('q');
    const inStock = searchParams.get('inStock');
    const beverageType = searchParams.get('beverageType');

    let query = db
      .select()
      .from(bottles)
      .where(eq(bottles.userId, authUser.userId));

    // Filter by beverage type
    if (beverageType) {
      query = query.where(eq(bottles.beverageType, beverageType));
    }

    // Apply filters
    if (locationId) {
      query = query.where(eq(bottles.locationId, locationId));
    }

    if (q) {
      query = query.where(
        ilike(bottles.name, `%${q}%`)
      );
    }

    if (inStock === 'true') {
      query = query.where(gt(bottles.quantity, 0));
    }

    const result = await query.orderBy(desc(bottles.createdAt));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get bottles error:', error);
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
    const result = bottleCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      producer,
      locationId,
      vintage,
      grapes,
      country,
      region,
      purchaseDate,
      purchaseSourceType,
      purchaseSourceName,
      priceAmount,
      priceCurrency,
      subLocationText,
      quantity,
      photoUrl,
    } = result.data;

    // Verify locationId belongs to user (if provided)
    if (locationId) {
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
    }

    // Accept extra fields from raw body (not in zod schema)
    const beverageType = body.beverageType === 'beer' ? 'beer' : 'wine';
    const notesShort = typeof body.notesShort === 'string' ? body.notesShort.slice(0, 500) : null;

    const newBottle = await db
      .insert(bottles)
      .values({
        userId: authUser.userId,
        name,
        producer: producer || null,
        locationId: locationId || null,
        vintage: vintage || null,
        grapes: grapes || null,
        country: country || null,
        region: region || null,
        purchaseDate: purchaseDate || null,
        purchaseSourceType: purchaseSourceType || null,
        purchaseSourceName: purchaseSourceName || null,
        priceAmount: priceAmount ? String(priceAmount) : null,
        priceCurrency: priceCurrency || null,
        subLocationText: subLocationText || null,
        quantity: quantity || 1,
        photoUrl: photoUrl || null,
        beverageType,
        notesShort: notesShort || null,
      })
      .returning();

    return NextResponse.json(newBottle[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Create bottle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
