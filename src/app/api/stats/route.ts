import { NextResponse } from 'next/server';
import { eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bottles, tastingSessions, tastingEntries, drinkLogs } from '@/lib/schema';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    const [userBottles, userSessions, userEntries, userDrinkLogs] = await Promise.all([
      db.select({
        id: bottles.id,
        name: bottles.name,
        producer: bottles.producer,
        vintage: bottles.vintage,
        grapes: bottles.grapes,
        country: bottles.country,
        region: bottles.region,
        status: bottles.status,
        beverageType: bottles.beverageType,
        photoUrl: bottles.photoUrl,
        priceAmount: bottles.priceAmount,
        priceCurrency: bottles.priceCurrency,
        quantity: bottles.quantity,
        createdAt: bottles.createdAt,
      }).from(bottles).where(eq(bottles.userId, authUser.userId)),

      db.select({
        id: tastingSessions.id,
        name: tastingSessions.name,
        tastedAt: tastingSessions.tastedAt,
      }).from(tastingSessions).where(eq(tastingSessions.userId, authUser.userId)),

      db.select({
        id: tastingEntries.id,
        tastingSessionId: tastingEntries.tastingSessionId,
        bottleId: tastingEntries.bottleId,
        adHocName: tastingEntries.adHocName,
        totalScore: tastingEntries.totalScore,
        appearanceScore: tastingEntries.appearanceScore,
        noseScore: tastingEntries.noseScore,
        palateScore: tastingEntries.palateScore,
        finishScore: tastingEntries.finishScore,
        balanceScore: tastingEntries.balanceScore,
      }).from(tastingEntries)
        .innerJoin(tastingSessions, eq(tastingEntries.tastingSessionId, tastingSessions.id))
        .where(eq(tastingSessions.userId, authUser.userId))
        .where(isNull(tastingEntries.guestId)),

      db.select({
        id: drinkLogs.id,
        bottleId: drinkLogs.bottleId,
        drankAt: drinkLogs.drankAt,
        rating: drinkLogs.rating,
      }).from(drinkLogs).where(eq(drinkLogs.userId, authUser.userId)),
    ]);

    return NextResponse.json({
      bottles: userBottles,
      tastingSessions: userSessions,
      tastingEntries: userEntries,
      drinkLogs: userDrinkLogs,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
