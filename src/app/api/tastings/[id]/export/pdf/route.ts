import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
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
        adHocName: tastingEntries.adHocName,
        bottleName: bottles.name,
        bottleProducer: bottles.producer,
        bottleVintage: bottles.vintage,
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
      })
      .from(tastingEntries)
      .leftJoin(bottles, eq(tastingEntries.bottleId, bottles.id))
      .leftJoin(locations, eq(bottles.locationId, locations.id))
      .where(eq(tastingEntries.tastingSessionId, params.id));

    // Create PDF
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    // Add header
    doc.fontSize(20).font('Helvetica-Bold').text(session[0].name, 50, 50);
    doc.fontSize(12).font('Helvetica').text(
      `Tasted: ${session[0].tastedAt?.toLocaleDateString() || 'N/A'}`,
      50,
      80
    );

    if (session[0].venue) {
      doc.text(`Venue: ${session[0].venue}`, 50, 100);
    }

    if (session[0].participants) {
      doc.text(`Participants: ${session[0].participants}`, 50, 120);
    }

    // Add entries
    let yPos = session[0].participants ? 160 : 140;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Wine Name', 50, yPos);
    doc.text('Vintage', 200, yPos);
    doc.text('Producer', 280, yPos);
    doc.text('Location', 400, yPos);
    doc.text('Scores', 520, yPos);

    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 10;

    doc.fontSize(9).font('Helvetica');

    for (const entry of entries) {
      const name = entry.adHocName || entry.bottleName || 'Unknown';
      const vintage = entry.bottleVintage || '-';
      const producer = entry.bottleProducer || '-';
      const location = entry.locationName || '-';

      // Scores breakdown
      const appearance = entry.appearanceScore || '-';
      const nose = entry.noseScore || '-';
      const palate = entry.palateScore || '-';
      const finish = entry.finishScore || '-';
      const balance = entry.balanceScore || '-';
      const total = entry.totalScore || '-';

      const scoresText = `A:${appearance} N:${nose} P:${palate} F:${finish} B:${balance} T:${total}`;

      doc.text(name, 50, yPos, { width: 150, ellipsis: true });
      doc.text(String(vintage), 200, yPos);
      doc.text(producer, 280, yPos, { width: 110, ellipsis: true });
      doc.text(location, 400, yPos, { width: 100, ellipsis: true });
      doc.text(scoresText, 520, yPos, { width: 40, ellipsis: true });

      yPos += 20;

      // Add notes if present
      if (entry.entryNotesShort) {
        doc.fontSize(8).font('Helvetica-Oblique');
        doc.text(entry.entryNotesShort, 50, yPos, {
          width: 500,
          ellipsis: true,
        });
        yPos += 15;
        doc.fontSize(9).font('Helvetica');
      }

      if (yPos > 750) {
        doc.addPage();
        yPos = 50;
      }
    }

    doc.end();

    // Wait for PDF to finish writing
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(
          new Response(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="tasting-${params.id}.pdf"`,
            },
          })
        );
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Export PDF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
