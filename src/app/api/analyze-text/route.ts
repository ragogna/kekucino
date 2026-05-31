import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeminiModel, PROMPTS, calcCostEur } from "@/lib/gemini";
import { verifyAuthToken } from "@/lib/auth-server";

const BodySchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    await verifyAuthToken(req);

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Testo non valido" }, { status: 400 });
    }

    const model = getGeminiModel();
    const result = await model.generateContent(PROMPTS.analyzeText(parsed.data.text));
    const text = result.response.text().trim();
    const meta = result.response.usageMetadata;
    const tokenUsage = {
      promptTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      costEur: calcCostEur(meta?.promptTokenCount ?? 0, meta?.candidatesTokenCount ?? 0),
    };

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossibile analizzare il testo. Riprova." }, { status: 422 });
    }

    const ingredients = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ingredients, tokenUsage });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    console.error("[analyze-text] error:", error);
    return NextResponse.json({ error: "Errore nell'analisi del testo" }, { status: 500 });
  }
}
