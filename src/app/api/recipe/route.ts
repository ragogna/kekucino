import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeminiModel, PROMPTS } from "@/lib/gemini";
import { verifyAuthToken } from "@/lib/auth-server";

const BodySchema = z.object({
  dishName: z.string().min(1).max(200),
  timing: z.enum(["veloce", "media", "lunga"]),
  timeMinutes: z.number().int().min(5).max(480),
  ingredients: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    await verifyAuthToken(req);

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { dishName, timing, timeMinutes, ingredients } = parsed.data;

    const model = getGeminiModel();
    const result = await model.generateContent(
      PROMPTS.getRecipe(dishName, timing, timeMinutes, ingredients)
    );
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossibile generare la ricetta. Riprova." }, { status: 422 });
    }

    const recipe = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ recipe });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    console.error("[recipe] error:", error);
    return NextResponse.json({ error: "Errore nella generazione della ricetta" }, { status: 500 });
  }
}
