"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChefHat, Star, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useCookingStore } from "@/store/cooking";
import { DishProposal } from "@/types";
import { formatTime, difficultyLabel, categoryColor } from "@/lib/utils";

export default function PiattiPage() {
  const router = useRouter();
  const { dishes, selectedTiming, selectDish, setStep, setSelectedTiming } = useCookingStore();

  useEffect(() => {
    if (dishes.length === 0) {
      router.replace("/cucina");
    }
  }, [dishes, router]);

  function getTimeForTiming(dish: DishProposal) {
    if (selectedTiming === "veloce") return dish.tempo_veloce_min;
    if (selectedTiming === "lunga") return dish.tempo_lungo_min;
    return dish.tempo_medio_min;
  }

  function chooseDish(dish: DishProposal) {
    selectDish(dish);
    setStep("ricetta");
    router.push("/ricetta");
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Proposte dello chef</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {dishes.length} idee per questa sera — scegli quella che preferisci
        </p>
      </div>

      {/* Timing selector */}
      <div className="food-card p-1 flex gap-1">
        {(["veloce", "media", "lunga"] as const).map((t) => {
          const active = selectedTiming === t;
          const labels = { veloce: "⚡ Veloce", media: "🕐 Media", lunga: "👨‍🍳 Elaborata" };
          return (
            <button
              key={t}
              onClick={() => setSelectedTiming(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Dishes */}
      <div className="space-y-4">
        {dishes.map((dish, i) => (
          <button
            key={dish.id ?? i}
            onClick={() => chooseDish(dish)}
            className="w-full food-card p-4 text-left hover:border-primary/40 transition-all group"
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{dish.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-foreground text-base leading-tight">{dish.nome}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor(dish.categoria)}`}>
                    {dish.categoria.replace("_", " ")}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{dish.descrizione}</p>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(getTimeForTiming(dish))}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <ChefHat className="w-3.5 h-3.5" />
                <span>{difficultyLabel(dish.difficolta)}</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(dish.difficolta)].map((_, j) => (
                  <Star key={j} className="w-3 h-3 fill-primary text-primary" />
                ))}
              </div>
            </div>

            {/* Wow factor */}
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 mb-3">
              <p className="text-xs text-amber-800 dark:text-amber-200 italic">
                ✨ {dish.wow_factor}
              </p>
            </div>

            {/* Missing ingredients */}
            {dish.ingredienti_mancanti?.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Da comprare:{" "}
                  <span className="text-foreground">
                    {dish.ingredienti_mancanti.slice(0, 3).join(", ")}
                    {dish.ingredienti_mancanti.length > 3 && ` +${dish.ingredienti_mancanti.length - 3}`}
                  </span>
                </span>
              </div>
            )}

            {/* CTA */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Ingredienti: {dish.ingredienti_principali.slice(0, 3).join(", ")}
              </span>
              <div className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                Scegli <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
