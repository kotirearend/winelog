import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { stringify } from 'csv-stringify/sync';
import { db } from '@/lib/db';
import { tastingSessions, tastingEntries, bottles, locations } from '@/lib/schema';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);

    // Verify session belongs to user
    const session = await db
      .select()
      .from(tastingSessions)
      .where(
        and(
          eq(tastingSessions.id, params.id),
          eq(tastingSessions.userId, authUser.userId)
        )
      );

    if (session.length === 0) {
      return NextResponse.json(
        { error: 'Tasting session not found' },
        { status: 404 }
      );
    }

    // Get entries with bottle and location details
    const entries = await db
      .select({
        entryId: tastingEntries.id,
        bottleId: tastingEntries.bottleId,
        adHocName: tastingEntries.adHocName,
        bottleName: bottles.name,
        bottleProducer: bottles.producer,
        bottleVintage: bottles.vintage,
        bottlePhotoUrl: bottles.photoUrl,
        priceAmount: bottles.priceAmount,
        priceCurrency: bottles.priceCurrency,
        locationName: locations.name,
        subLocationText: bottles.subLocationText,
        appearanceScore: tastingEntries.appearanceScore,
        noseScore: tastingEntries.noseScore,
        palateScore: tastingEntries.palateScore,
        finishScore: tastingEntries.finishScore,
        balanceScore: tastingEntries.balanceScore,
        totalScore: tastingEntries.totalScore,
        entryNotesShort: tastingEntries.notesShort,
        entryNotesLong: tastingEntries.notesLong,
        entryTags: tastingEntries.tags,
      })
      .from(tastingEntries)
      .leftJoin(bottles, eq(tastingEntries.bottleId, bottles.id))
      .leftJoin(locations, eq(bottles.locationId, locations.id))
      .where(eq(tastingEntries.tastingSessionId, params.id));

    // Format data for CSV
    const csvData = entries.map((entry) => ({
      sessionName: session[0].name,
      tastedAt: session[0].tastedAt?.toISOString() || '',
      venue: session[0].venue || '',
      participants: session[0].participants || '',
      entryName: entry.adHocName || entry.bottleName || '',
      vintage: entry.bottleVintage || '',
      producer: entry.bottleProducer || '',
      priceAmount: entry.priceAmount || '',
      priceCurrency: entry.priceCurrency || '',
      locationName: entry.locationName || '',
      subLocationText: entry.subLocationText || '',
      appearance: entry.appearanceScore || '',
      nose: entry.noseScore || '',
      palate: entry.palateScore || '',
      finish: entry.finishScore || '',
      balance: entry.balanceScore || '',
      total: entry.totalScore || '',
      notesShort: entry.entryNotesShort || '',
      notesLong: entry.entryNotesLong || '',
      tags: Array.isArray(entry.entryTags)
        ? entry.entryTags.join('; ')
        : '',
    }));

    const csv = stringify(csvData, {
      header: true,
      columns: [
        'sessionName',
        'tastedAt',
        'venue',
        'participants',
        'entryName',
        'vintage',
        'producer',
        'priceAmount',
        'priceCurrency',
        'locationName',
        'subLocationText',
        'appearance',
        'nose',
        'palate',
        'finish',
        'balance',
        'total',
        'notesShort',
        'notesLong',
        'tags',
      ],
    });

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tasting-${params.id}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Export CSV error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
