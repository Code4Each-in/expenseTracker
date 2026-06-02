import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_NAMES } from "@/lib/constants";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  // Require authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string" || text.length > 500) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const categoryList = CATEGORY_NAMES.join(", ");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Extract expense details from this text. Return ONLY a valid JSON object with no explanation.

Text: "${text}"

Rules:
- amount: number (rupees, no symbol)
- category: one of [${categoryList}] (pick closest match)
- description: short clean description (2-4 words max), Title Case

Example output:
{"amount": 120, "category": "Food", "description": "Milk"}

JSON:`,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Extract JSON even if Claude adds surrounding text
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json(
      { error: "Could not parse response" },
      { status: 422 }
    );
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate
    if (
      typeof parsed.amount !== "number" ||
      parsed.amount <= 0 ||
      !CATEGORY_NAMES.includes(parsed.category) ||
      typeof parsed.description !== "string"
    ) {
      throw new Error("Invalid structure");
    }

    return NextResponse.json({
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid response from AI" },
      { status: 422 }
    );
  }
}
