import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthUser } from "@/lib/auth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Authenticate — prevents abuse
    await getAuthUser(request);

    const { imageBase64 } = await request.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Detect media type from data URL prefix
    let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" =
      "image/jpeg";
    if (imageBase64.startsWith("data:image/png")) {
      mediaType = "image/png";
    } else if (imageBase64.startsWith("data:image/webp")) {
      mediaType = "image/webp";
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `Analyze this wine or beer label image. Extract the following details.
Return ONLY valid JSON — no markdown, no code fences, no explanation:
{
  "name": "the wine/beer name",
  "producer": "winery or brewery name",
  "vintage": 2020,
  "country": "France",
  "region": "Bordeaux",
  "grapes": ["Merlot", "Cabernet Sauvignon"],
  "confidence": "high"
}
Set any field you cannot determine to null (or [] for grapes).
Set confidence to "high" if the label is clearly readable, "medium" if partially visible, or "low" if very unclear.`,
            },
          ],
        },
      ],
    });

    // Extract the text content from Claude's response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from vision model" },
        { status: 500 }
      );
    }

    // Parse JSON — Claude sometimes wraps in code fences despite the instruction
    let rawText = textBlock.text.trim();
    // Strip markdown code fences if present
    rawText = rawText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");

    const parsed = JSON.parse(rawText);

    return NextResponse.json({
      name: parsed.name ?? null,
      producer: parsed.producer ?? null,
      vintage: parsed.vintage ?? null,
      country: parsed.country ?? null,
      region: parsed.region ?? null,
      grapes: Array.isArray(parsed.grapes) ? parsed.grapes : [],
      confidence: parsed.confidence ?? "medium",
    });
  } catch (err: unknown) {
    console.error("Scan label error:", err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse vision response" },
        { status: 500 }
      );
    }

    if (err instanceof Error && err.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Label scan failed" },
      { status: 500 }
    );
  }
}
