import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeminiModel, PROMPTS, calcCostEur } from "@/lib/gemini";
import { verifyAuthToken } from "@/lib/auth-server";

const RECIPE_MODEL = "gemini-2.5-pro";

const BodySchema = z.object({
  dishName: z.string().min(1).max(200),
  mode: z.enum(["tradizionale", "stellato"]),
  porzioni: z.number().int().min(1).max(12),
  ingredients: z.string().min(1).max(2000),
  adattato: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    await verifyAuthToken(req);

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
    }

    const { dishName, mode, porzioni, ingredients, adattato } = parsed.data;

    const model = getGeminiModel(RECIPE_MODEL);
    const result = await model.generateContent(
      PROMPTS.getRecipe(dishName, mode, porzioni, ingredients, adattato)
    );
    const text = result.response.text().trim();
    const meta = result.response.usageMetadata;
    const tokenUsage = {
      promptTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      costEur: calcCostEur(meta?.promptTokenCount ?? 0, meta?.candidatesTokenCount ?? 0, RECIPE_MODEL),
    };

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossibile generare la ricetta. Riprova." }, { status: 422 });
    }

    const recipe = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ recipe, tokenUsage });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStatus = (error as any)?.status ?? (error as any)?.httpStatus;

    if (errMsg.includes("authorization")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    if (errStatus === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "Quota API esaurita (Gemini Pro). Attiva il billing su Google AI Studio o riprova più tardi." },
        { status: 429 }
      );
    }
    if (errStatus === 503 || errMsg.includes("overloaded") || errMsg.includes("503")) {
      return NextResponse.json(
        { error: "Modello sovraccarico. Riprova tra pochi secondi." },
        { status: 503 }
      );
    }
    console.error("[recipe] error:", errStatus, errMsg);
    return NextResponse.json({ error: "Errore nella generazione della ricetta" }, { status: 500 });
  }
}
