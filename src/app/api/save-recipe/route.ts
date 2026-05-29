import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuthToken } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const BodySchema = z.object({
  dish: z.object({
    id: z.string(),
    nome: z.string(),
    descrizione: z.string(),
    emoji: z.string(),
    categoria: z.string(),
  }),
  timing: z.enum(["veloce", "media", "lunga"]),
  recipe: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyAuthToken(req);

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
    }

    const { dish, timing, recipe } = parsed.data;

    const docRef = adminDb()
      .collection("users")
      .doc(uid)
      .collection("recipes")
      .doc();

    await docRef.set({
      id: docRef.id,
      userId: uid,
      dish,
      timing,
      recipe,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    console.error("[save-recipe] error:", error);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}
