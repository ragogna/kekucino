"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, ChefHat, Users, Utensils, CheckCircle2,
  Circle, Lightbulb, AlertTriangle, Wine, Leaf,
  BookmarkPlus, RotateCcw, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCookingStore } from "@/store/cooking";
import { formatTime, difficultyLabel } from "@/lib/utils";
import { TimingVariant } from "@/types";

const TIMING_OPTIONS: { value: TimingVariant; label: string; icon: string; desc: string }[] = [
  { value: "veloce", label: "Veloce", icon: "⚡", desc: "Massima praticità" },
  { value: "media", label: "Media", icon: "🕐", desc: "Consigliata dallo chef" },
  { value: "lunga", label: "Elaborata", icon: "👨‍🍳", desc: "Per il massimo risultato" },
];

export default function RicettaPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { selectedDish, selectedTiming, setSelectedTiming, ingredients, recipe, setRecipe, reset } = useCookingStore();
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedDish) {
      router.replace("/cucina");
    }
  }, [selectedDish, router]);

  useEffect(() => {
    if (selectedDish && !recipe) {
      fetchRecipe();
    }
  }, [selectedDish, selectedTiming]);

  async function fetchRecipe() {
    if (!selectedDish) return;
    setLoading(true);
    setCompletedSteps(new Set());

    const timeMap = {
      veloce: selectedDish.tempo_veloce_min,
      media: selectedDish.tempo_medio_min,
      lunga: selectedDish.tempo_lungo_min,
    };

    try {
      const token = await getIdToken();
      const ingredientList = ingredients.map((i) => i.nome).join(", ");

      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dishName: selectedDish.nome,
          timing: selectedTiming,
          timeMinutes: timeMap[selectedTiming],
          ingredients: ingredientList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Errore");
        return;
      }
      setRecipe(data.recipe);
    } catch {
      toast.error("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  function changeTiming(timing: TimingVariant) {
    setSelectedTiming(timing);
    setRecipe(null as any);
    fetchRecipe();
  }

  function toggleStep(num: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }

  async function saveRecipe() {
    if (!selectedDish || !recipe) return;
    setSaving(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/save-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dish: selectedDish, timing: selectedTiming, recipe }),
      });
      if (res.ok) {
        toast.success("Ricetta salvata nella tua storia!");
      } else {
        toast.error("Errore nel salvataggio");
      }
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setSaving(false);
    }
  }

  if (!selectedDish) return null;

  const timeMap = {
    veloce: selectedDish.tempo_veloce_min,
    media: selectedDish.tempo_medio_min,
    lunga: selectedDish.tempo_lungo_min,
  };

  return (
    <div className="pb-24">
      {/* Timing selector */}
      <div className="px-4 pt-4 pb-2 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span>{selectedDish.emoji}</span>
            {selectedDish.nome}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{selectedDish.descrizione}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Scegli la versione
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TIMING_OPTIONS.map((opt) => {
              const active = selectedTiming === opt.value;
              const isRecommended = opt.value === "media";
              return (
                <button
                  key={opt.value}
                  onClick={() => changeTiming(opt.value)}
                  className={`food-card p-3 flex flex-col items-center gap-1 transition-all relative ${
                    active ? "border-primary bg-primary/5" : "hover:border-primary/30"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                        CHEF
                      </span>
                    </div>
                  )}
                  <span className="text-lg">{opt.icon}</span>
                  <span className={`text-xs font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center">{opt.desc}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {formatTime(timeMap[opt.value])}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 chef-gradient rounded-2xl flex items-center justify-center float-animation">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Il chef sta elaborando la ricetta...</p>
            <p className="text-sm text-muted-foreground mt-1">Calcolo ingredienti al grammo</p>
          </div>
          <div className="space-y-2 w-full max-w-xs">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`skeleton rounded-xl h-12 opacity-${100 - i * 20}`} />
            ))}
          </div>
        </div>
      ) : recipe ? (
        <div className="px-4 space-y-6 mt-4">
          {/* Chef intro */}
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-3">
              <ChefHat className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200 italic leading-relaxed">
                "{recipe.intro_chef}"
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Clock, label: "Tempo", value: formatTime(recipe.tempo_totale_min) },
              { icon: Users, label: "Porzioni", value: `${recipe.porzioni} pers.` },
              { icon: ChefHat, label: "Difficoltà", value: difficultyLabel(recipe.difficolta) },
              { icon: Utensils, label: "Passaggi", value: `${recipe.passi?.length ?? 0}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="food-card p-2 text-center">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-xs font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Attrezzatura */}
          {recipe.attrezzatura?.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                Attrezzatura
              </h2>
              <div className="flex flex-wrap gap-2">
                {recipe.attrezzatura.map((att: string, i: number) => (
                  <span key={i} className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-full font-medium">
                    {att}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Ingredienti
            </h2>
            <div className="food-card overflow-hidden">
              {recipe.ingredienti?.map((ing: any, i: number) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i !== recipe.ingredienti.length - 1 ? "border-b border-border" : ""
                  } ${ing.opzionale ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">{ing.nome}</span>
                    {ing.opzionale && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                        opz.
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className="text-sm font-bold text-primary">
                      {ing.quantita} {ing.unita}
                    </span>
                    {ing.note && (
                      <p className="text-[10px] text-muted-foreground">{ing.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-primary" />
              Procedimento
            </h2>
            <div className="space-y-3">
              {recipe.passi?.map((step: any) => {
                const done = completedSteps.has(step.numero);
                return (
                  <div
                    key={step.numero}
                    className={`food-card p-4 transition-all ${done ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStep(step.numero)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {done ? (
                          <CheckCircle2 className="w-6 h-6 text-primary fill-primary/10" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-primary">Passo {step.numero}</span>
                          <h3 className="text-sm font-semibold text-foreground">{step.titolo}</h3>
                          {step.tempo_min > 0 && (
                            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                              ⏱ {step.tempo_min} min
                            </span>
                          )}
                        </div>

                        {step.temperatura && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-2">
                            🌡️ {step.temperatura}
                          </div>
                        )}

                        <p className="text-sm text-foreground leading-relaxed">{step.istruzione}</p>

                        {step.trucco_chef && (
                          <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 flex gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-200 italic">
                              {step.trucco_chef}
                            </p>
                          </div>
                        )}

                        {step.attenzione && (
                          <div className="mt-2 bg-red-50 dark:bg-red-950/20 rounded-xl p-3 flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-800 dark:text-red-200">
                              {step.attenzione}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Impiattamento */}
          {recipe.impiattamento && (
            <div className="food-card p-4 border-l-4 border-l-primary">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Impiattamento
              </h3>
              <p className="text-sm text-foreground italic">{recipe.impiattamento}</p>
            </div>
          )}

          {/* Chef tip finale */}
          {recipe.consiglio_finale && (
            <div className="chef-gradient rounded-2xl p-4 text-white">
              <div className="flex gap-3">
                <ChefHat className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1 opacity-80">
                    Il segreto del chef
                  </p>
                  <p className="text-sm leading-relaxed">{recipe.consiglio_finale}</p>
                </div>
              </div>
            </div>
          )}

          {/* Wine + Varianti */}
          <div className="space-y-3">
            {recipe.abbinamento_vino && (
              <div className="food-card p-4 flex gap-3">
                <Wine className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Abbinamento vino
                  </p>
                  <p className="text-sm text-foreground">{recipe.abbinamento_vino}</p>
                </div>
              </div>
            )}
            {recipe.varianti && (
              <div className="food-card p-4 flex gap-3">
                <Leaf className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Varianti
                  </p>
                  <p className="text-sm text-foreground">{recipe.varianti}</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress indicator */}
          {recipe.passi?.length > 0 && (
            <div className="food-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progresso cottura</span>
                <span className="text-sm font-bold text-primary">
                  {completedSteps.size}/{recipe.passi.length}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(completedSteps.size / recipe.passi.length) * 100}%` }}
                />
              </div>
              {completedSteps.size === recipe.passi.length && (
                <p className="text-center text-sm font-bold text-primary mt-2">
                  🎉 Buon appetito!
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pb-6">
            <button
              onClick={saveRecipe}
              disabled={saving}
              className="flex-1 food-card py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:border-primary/50 transition-all disabled:opacity-60"
            >
              <BookmarkPlus className="w-4 h-4" />
              {saving ? "Salvando..." : "Salva ricetta"}
            </button>
            <button
              onClick={() => {
                reset();
                router.push("/cucina");
              }}
              className="flex-1 food-card py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Nuova ricerca
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
