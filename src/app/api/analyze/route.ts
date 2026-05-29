import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeminiModel, PROMPTS } from "@/lib/gemini";
import { verifyAuthToken } from "@/lib/auth-server";

const MAX_PHOTOS = 6;
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const BodySchema = z.object({
  photos: z
    .array(z.string().min(1))
    .min(1, "Almeno una foto richiesta")
    .max(MAX_PHOTOS, `Massimo ${MAX_PHOTOS} foto`),
});

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyAuthToken(req);

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
    }

    const { photos } = parsed.data;

    for (const photo of photos) {
      const sizeBytes = (photo.length * 3) / 4;
      if (sizeBytes > MAX_PHOTO_SIZE_BYTES) {
        return NextResponse.json({ error: "Foto troppo grande (max 5MB ciascuna)" }, { status: 400 });
      }
    }

    const model = getGeminiModel();

    const imageParts = photos.map((base64) => ({
      inlineData: { data: base64, mimeType: "image/jpeg" as const },
    }));

    const result = await model.generateContent([PROMPTS.analyzePhotos, ...imageParts]);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossibile analizzare le foto. Riprova." }, { status: 422 });
    }

    const ingredients = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ ingredients, uid });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    console.error("[analyze] error:", error);
    return NextResponse.json({ error: "Errore nell'analisi delle foto" }, { status: 500 });
  }
}
