"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, ChefHat, User, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCookingStore } from "@/store/cooking";
import { toast } from "sonner";
import type { DishProposal } from "@/types";

interface Message {
  role: "user" | "chef";
  text: string;
}

const INITIAL_MESSAGE =
  "Ciao! 👨‍🍳 Cosa ti piacerebbe mangiare oggi? Puoi dirmi \"ho voglia di pasta\", \"qualcosa di veloce\", oppure anche solo come ti senti — se sei stanco, hai freddo, vuoi festeggiare... ci penso io!";

export default function ChatPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { setDishes, setIngredients, setStep, setLastCallCost } = useCookingStore();

  const [messages, setMessages] = useState<Message[]>([
    { role: "chef", text: INITIAL_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || fetchingRef.current) return;

    fetchingRef.current = true;
    const userMsg: Message = { role: "user", text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const history = newMessages
      .slice(1, -1)
      .map((m) => ({
        role: m.role === "chef" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

    const MAX_RETRIES = 2;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const token = await getIdToken();
        const res = await fetch("/api/chef-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ history, message: text }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 429) {
            toast.error(data.error ?? "Quota AI esaurita. Riprova tra qualche minuto.");
          } else if (res.status === 401) {
            toast.error("Sessione scaduta. Ricarica la pagina.");
          } else {
            toast.error(data.error ?? `Errore ${res.status}`);
          }
          break;
        }

        if (data.tokenUsage?.costEur) setLastCallCost(data.tokenUsage.costEur);

        const reply = data.reply as string;
        const jsonMatch = reply.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const dishes = JSON.parse(jsonMatch[0]) as DishProposal[];
            if (Array.isArray(dishes) && dishes.length > 0 && dishes[0].nome) {
              setDishes(dishes);
              setIngredients([]);
              setStep("piatti");
              router.push("/piatti");
              return;
            }
          } catch {}
        }

        setMessages((prev) => [...prev, { role: "chef", text: reply }]);
        break;
      } catch {
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 800));
        } else {
          toast.error("Errore di connessione. Controlla la rete e riprova.");
        }
      }
    }

    fetchingRef.current = false;
    setLoading(false);
  }

  function resetChat() {
    setMessages([{ role: "chef", text: INITIAL_MESSAGE }]);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-[calc(100svh-7rem)]">
      {/* In-page header */}
      <div className="shrink-0 px-4 pt-4 pb-3 flex items-center justify-between border-b border-border">
        <div>
          <h1 className="font-bold text-foreground flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Chiedi allo chef
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dimmi cosa vuoi o come ti senti, ci pensa lo chef
          </p>
        </div>
        <button
          onClick={resetChat}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Ricomincia"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {msg.role === "chef" ? (
              <div className="w-8 h-8 chef-gradient rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div
              className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "chef"
                  ? "bg-secondary text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 chef-gradient rounded-xl flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <div className="bg-secondary px-4 py-3.5 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5 items-end h-5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/60 wave-dot" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/60 wave-dot" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/60 wave-dot" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Lo chef sta pensando...</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Cosa vuoi mangiare? O come ti senti..."
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-11 h-11 chef-gradient rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
