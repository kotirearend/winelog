import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        defaultCurrency: users.defaultCurrency,
        beverageType: users.beverageType,
        scoringMode: users.scoringMode,
        preferredLanguage: users.preferredLanguage,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, authUser.userId));

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.defaultCurrency !== undefined) updateData.defaultCurrency = body.defaultCurrency;
    if (body.currency !== undefined) updateData.defaultCurrency = body.currency;
    if (body.beverageType !== undefined) updateData.beverageType = body.beverageType;
    if (body.scoringMode !== undefined) updateData.scoringMode = body.scoringMode;
    if (body.preferredLanguage !== undefined) updateData.preferredLanguage = body.preferredLanguage;

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, authUser.userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        defaultCurrency: users.defaultCurrency,
        beverageType: users.beverageType,
        scoringMode: users.scoringMode,
        preferredLanguage: users.preferredLanguage,
        createdAt: users.createdAt,
      });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
