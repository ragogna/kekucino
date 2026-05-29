"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Trash2, Plus, ArrowRight, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCookingStore } from "@/store/cooking";
import { DetectedIngredient } from "@/types";
import { ingredientCategoryIcon } from "@/lib/utils";

export default function IngredientiPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { ingredients, updateIngredient, removeIngredient, setDishes, setStep } = useCookingStore();
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (ingredients.length === 0) {
      router.replace("/cucina");
    }
  }, [ingredients, router]);

  function startEdit(index: number, nome: string) {
    setEditingIndex(index);
    setEditValue(nome);
  }

  function saveEdit(index: number) {
    if (editValue.trim()) {
      updateIngredient(index, { ...ingredients[index], nome: editValue.trim() });
    }
    setEditingIndex(null);
  }

  async function generateDishes() {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/dishes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ingredients }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Errore");
        return;
      }

      setDishes(data.dishes);
      setStep("piatti");
      router.push("/piatti");
    } catch {
      toast.error("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  const byCategory = ingredients.reduce<Record<string, DetectedIngredient[]>>((acc, ing) => {
    const cat = ing.categoria ?? "altro";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ing);
    return acc;
  }, {});

  const categoryOrder = ["proteina", "verdura", "frutta", "latticini", "carboidrato", "condimento", "spezia", "altro"];
  const categoryLabel: Record<string, string> = {
    proteina: "Proteine",
    verdura: "Verdure",
    frutta: "Frutta",
    latticini: "Latticini",
    carboidrato: "Carboidrati",
    condimento: "Condimenti",
    spezia: "Spezie & Aromi",
    altro: "Altro",
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ingredienti trovati</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {ingredients.length} ingredienti rilevati — modifica o rimuovi se necessario
        </p>
      </div>

      <div className="space-y-4">
        {categoryOrder
          .filter((cat) => byCategory[cat]?.length > 0)
          .map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{ingredientCategoryIcon(cat)}</span>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {categoryLabel[cat]}
                </h2>
              </div>
              <div className="space-y-2">
                {byCategory[cat].map((ing, globalIndex) => {
                  const index = ingredients.indexOf(ing);
                  return (
                    <div key={index} className="food-card p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        {editingIndex === index ? (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(index);
                              if (e.key === "Escape") setEditingIndex(null);
                            }}
                            className="w-full bg-transparent text-sm font-medium border-b border-primary outline-none pb-0.5"
                          />
                        ) : (
                          <p className="text-sm font-medium text-foreground truncate">{ing.nome}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{ing.quantita_stimata}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingIndex === index ? (
                          <>
                            <button
                              onClick={() => saveEdit(index)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(index, ing.nome)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeIngredient(index)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      <button
        onClick={generateDishes}
        disabled={loading || ingredients.length === 0}
        className="w-full chef-gradient text-white rounded-2xl py-4 px-6 font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Il chef sta pensando...
          </>
        ) : (
          <>
            <ChefHat className="w-5 h-5" />
            Proponi piatti
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
