import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeminiModel, PROMPTS, calcCostEur } from "@/lib/gemini";
import { verifyAuthToken } from "@/lib/auth-server";

const ContentPartSchema = z.object({ text: z.string() });
const HistoryItemSchema = z.object({
  role: z.enum(["user", "model"]),
  parts: z.array(ContentPartSchema),
});

const BodySchema = z.object({
  history: z.array(HistoryItemSchema),
  message: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  try {
    await verifyAuthToken(req);

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
    }

    const { history, message } = parsed.data;

    const model = getGeminiModel("gemini-2.5-flash", PROMPTS.chefChat);

    const MAX_RETRIES = 3;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const chat = model.startChat({ history });

        const result = await chat.sendMessage(message);

        let reply: string;
        try {
          reply = result.response.text().trim();
        } catch {
          return NextResponse.json(
            { reply: "Mi dispiace, non posso rispondere. Prova a riformulare." },
            { status: 200 }
          );
        }

        const meta = result.response.usageMetadata;
        const tokenUsage = {
          promptTokens: meta?.promptTokenCount ?? 0,
          outputTokens: meta?.candidatesTokenCount ?? 0,
          costEur: calcCostEur(meta?.promptTokenCount ?? 0, meta?.candidatesTokenCount ?? 0),
        };

        return NextResponse.json({ reply, tokenUsage });
      } catch (err: unknown) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        const status = (err as any)?.status ?? (err as any)?.httpStatus;
        // Never retry on 429/auth — fail fast
        if (status === 429 || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("authorization")) {
          throw err;
        }
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
      }
    }
    throw lastErr;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStatus = (error as any)?.status ?? (error as any)?.httpStatus;

    if (errMsg.includes("authorization")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    if (errStatus === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "Quota API Gemini esaurita. Riprova tra qualche minuto." },
        { status: 429 }
      );
    }
    if (errStatus === 503 || errMsg.includes("overloaded") || errMsg.includes("503")) {
      return NextResponse.json(
        { error: "Gemini è sovraccarico. Riprova tra pochi secondi." },
        { status: 503 }
      );
    }
    if (errMsg.includes("fetch failed") || errMsg.includes("TypeError") || errMsg.includes("ECONNREFUSED") || errMsg.includes("Error fetching from")) {
      return NextResponse.json(
        { error: "Errore di rete con l'AI. Riprova tra qualche secondo." },
        { status: 503 }
      );
    }

    console.error("[chef-chat] error:", errStatus, errMsg);
    return NextResponse.json(
      { error: `Errore AI: ${errMsg.slice(0, 200)}` },
      { status: 500 }
    );
  }
}
