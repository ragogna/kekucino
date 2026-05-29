import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeminiModel, PROMPTS } from "@/lib/gemini";
import { verifyAuthToken } from "@/lib/auth-server";

const BodySchema = z.object({
  ingredients: z
    .array(
      z.object({
        nome: z.string(),
        quantita_stimata: z.string(),
        categoria: z.string(),
        confidenza: z.number(),
      })
    )
    .min(1, "Almeno un ingrediente richiesto")
    .max(50),
});

export async function POST(req: NextRequest) {
  try {
    await verifyAuthToken(req);

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
    }

    const { ingredients } = parsed.data;

    const ingredientList = ingredients
      .map((i) => `${i.nome} (${i.quantita_stimata})`)
      .join(", ");

    const model = getGeminiModel();
    const result = await model.generateContent(PROMPTS.proposeDishes(ingredientList));
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossibile generare proposte. Riprova." }, { status: 422 });
    }

    const dishes = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ dishes });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    console.error("[dishes] error:", error);
    return NextResponse.json({ error: "Errore nella generazione dei piatti" }, { status: 500 });
  }
}
