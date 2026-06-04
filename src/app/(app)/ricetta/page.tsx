"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, ChefHat, Users, Utensils, CheckCircle2,
  Circle, Lightbulb, AlertTriangle, Wine, Leaf,
  BookmarkPlus, RotateCcw, Sparkles, Heart, FileDown, Minus, Plus
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCookingStore } from "@/store/cooking";
import { usePantryStore } from "@/store/pantry";
import { formatTime, difficultyLabel } from "@/lib/utils";
import { RecipeMode } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MODE_OPTIONS: { value: RecipeMode; label: string; icon: string; desc: string }[] = [
  { value: "tradizionale", label: "Tradizionale", icon: "🍝", desc: "La ricetta autentica, fatta a regola d'arte" },
  { value: "stellato", label: "Stellato", icon: "⭐", desc: "Versione d'autore: più tecnica, risultato eccezionale" },
];

export default function RicettaPage() {
  const router = useRouter();
  const { getIdToken, user } = useAuth();
  const { selectedDish, selectedMode, setSelectedMode, porzioni, setPorzioni, recipe, setRecipe, reset, addCost } = useCookingStore();
  const pantryItems = usePantryStore((s) => s.items);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!selectedDish) {
      router.replace("/cucina");
    }
  }, [selectedDish, router]);

  useEffect(() => {
    if (selectedDish && !recipe) {
      fetchRecipe();
    }
  }, [selectedDish, selectedMode, porzioni]);

  async function fetchRecipe() {
    if (!selectedDish) return;
    setLoading(true);
    setCompletedSteps(new Set());

    try {
      const token = await getIdToken();
      const available = pantryItems.filter((i) => !i.consumed);
      const ingredientList = available.length > 0
        ? available.map((i) => i.nome).join(", ")
        : selectedDish.ingredienti_principali.join(", ");

      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dishName: selectedDish.nome,
          mode: selectedMode,
          porzioni,
          ingredients: ingredientList,
          adattato: selectedDish.adattato ?? false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Errore");
        return;
      }
      if (data.tokenUsage?.costEur) addCost(data.tokenUsage.costEur);
      setRecipe(data.recipe);
    } catch {
      toast.error("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(mode: RecipeMode) {
    if (mode === selectedMode) return;
    setSelectedMode(mode);
    setRecipe(null as any);
    // fetch parte dall'effect su selectedMode
  }

  function changePorzioni(delta: number) {
    const next = Math.max(1, Math.min(12, porzioni + delta));
    if (next === porzioni) return;
    setPorzioni(next);
    setRecipe(null as any);
    // fetch parte dall'effect su porzioni
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
        body: JSON.stringify({ dish: selectedDish, mode: selectedMode, recipe }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedRecipeId(data.id);
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

  async function toggleFavorite() {
    if (!savedRecipeId || !user) {
      toast.info("Salva prima la ricetta per aggiungerla ai preferiti");
      return;
    }
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    try {
      await updateDoc(doc(db, "users", user.uid, "recipes", savedRecipeId), {
        isFavorite: newVal,
      });
      toast.success(newVal ? "Aggiunta ai preferiti ❤️" : "Rimossa dai preferiti");
    } catch {
      setIsFavorite(!newVal);
      toast.error("Errore nell'aggiornamento");
    }
  }

  async function handleExportPDF() {
    if (!selectedDish || !recipe) return;
    try {
      const { exportRecipePDF } = await import("@/lib/export-pdf");
      exportRecipePDF(selectedDish, selectedMode, recipe);
      toast.success("PDF esportato!");
    } catch {
      toast.error("Errore nell'esportazione PDF");
    }
  }

  if (!selectedDish) return null;

  return (
    <div className="pb-24">
      {/* Mode + porzioni selector */}
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
          <div className="grid grid-cols-2 gap-2">
            {MODE_OPTIONS.map((opt) => {
              const active = selectedMode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => changeMode(opt.value)}
                  disabled={loading}
                  className={`food-card p-3 flex flex-col items-center gap-1 text-center transition-all disabled:opacity-60 ${
                    active ? "border-primary bg-primary/5" : "hover:border-primary/30"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Porzioni stepper */}
        <div className="food-card p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Porzioni</span>
            <span className="text-xs text-muted-foreground">(quantità per {porzioni} {porzioni === 1 ? "persona" : "persone"})</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => changePorzioni(-1)}
              disabled={loading || porzioni <= 1}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary disabled:opacity-40 transition-all"
              aria-label="Riduci porzioni"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold text-primary w-6 text-center">{porzioni}</span>
            <button
              onClick={() => changePorzioni(1)}
              disabled={loading || porzioni >= 12}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary disabled:opacity-40 transition-all"
              aria-label="Aumenta porzioni"
            >
              <Plus className="w-4 h-4" />
            </button>
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

          {/* Adattamento dispensa */}
          {(recipe.nota_adattamento || selectedDish.adattato) && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <Leaf className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-1">
                    Riadattato alla tua dispensa
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    {recipe.nota_adattamento || selectedDish.nota_adattamento || "Versione adattata agli ingredienti disponibili: non è la ricetta originale."}
                  </p>
                </div>
              </div>
            </div>
          )}

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
          <div className="grid grid-cols-2 gap-3 pb-2">
            <button
              onClick={saveRecipe}
              disabled={saving || !!savedRecipeId}
              className="food-card py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:border-primary/50 transition-all disabled:opacity-60"
            >
              <BookmarkPlus className="w-4 h-4" />
              {saving ? "Salvando..." : savedRecipeId ? "Salvata ✓" : "Salva ricetta"}
            </button>
            <button
              onClick={toggleFavorite}
              className={`food-card py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                isFavorite
                  ? "border-red-300 bg-red-50 text-red-600 dark:bg-red-950/20"
                  : "text-muted-foreground hover:text-red-500 hover:border-red-200"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              {isFavorite ? "Preferita ❤️" : "Aggiungi ai ❤️"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 pb-6">
            <button
              onClick={handleExportPDF}
              disabled={!recipe}
              className="food-card py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/50 transition-all disabled:opacity-60"
            >
              <FileDown className="w-4 h-4" />
              Esporta PDF
            </button>
            <button
              onClick={() => {
                reset();
                router.push("/cucina");
              }}
              className="food-card py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
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
