"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, ArrowRight, Edit2, Check, X, RotateCcw, Plus, Camera } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useCookingStore } from "@/store/cooking";
import { usePantryStore } from "@/store/pantry";
import { DetectedIngredient } from "@/types";
import { ingredientCategoryIcon } from "@/lib/utils";

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

const categoryOrder = ["proteina", "verdura", "frutta", "latticini", "carboidrato", "condimento", "spezia", "altro"];

interface PantryItemProps {
  ing: DetectedIngredient;
  index: number;
  editingIndex: number | null;
  editValue: string;
  onStartEdit: (index: number, nome: string) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
  onSetEditValue: (v: string) => void;
  onRemove: (index: number) => void;
  onToggleConsumed: (index: number) => void;
}

function PantryItem({
  ing, index, editingIndex, editValue,
  onStartEdit, onSaveEdit, onCancelEdit, onSetEditValue, onRemove, onToggleConsumed,
}: PantryItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const isEditing = editingIndex === index;

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isEditing) return;
    startX.current = e.clientX;
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    const dx = e.clientX - startX.current;
    setSwipeX(Math.max(-85, Math.min(85, dx)));
  }

  function onPointerUp() {
    isDragging.current = false;
    if (swipeX < -65) onToggleConsumed(index);
    else if (swipeX > 65 && ing.consumed) onToggleConsumed(index);
    setSwipeX(0);
  }

  const swipeHint = swipeX < -20 ? (ing.consumed ? "" : "Esaurito") : swipeX > 20 && ing.consumed ? "Ripristina" : "";

  return (
    <div className="relative overflow-hidden rounded-xl my-1.5" style={{ touchAction: "pan-y" }}>
      {/* Swipe background */}
      {!ing.consumed && (
        <div
          className="absolute inset-0 flex items-center justify-end pr-5 rounded-xl text-white text-xs font-bold gap-1"
          style={{ background: "linear-gradient(90deg, transparent, #d97706)" }}
        >
          <span>Esaurito →</span>
        </div>
      )}
      {ing.consumed && (
        <div
          className="absolute inset-0 flex items-center pl-5 rounded-xl text-white text-xs font-bold gap-1"
          style={{ background: "linear-gradient(270deg, transparent, #16a34a)" }}
        >
          <span>← Ripristina</span>
        </div>
      )}

      {/* Card */}
      <div
        className={`relative food-card px-4 py-3.5 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none ${
          ing.consumed ? "opacity-55" : ""
        }`}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isDragging.current ? "none" : "transform 0.22s ease",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => { isDragging.current = false; setSwipeX(0); }}
      >
        {/* Emoji */}
        <span className="text-2xl flex-shrink-0">{ingredientCategoryIcon(ing.categoria)}</span>

        {/* Name + qty */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => onSetEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit(index);
                if (e.key === "Escape") onCancelEdit();
              }}
              className="w-full bg-transparent text-sm font-semibold border-b border-primary outline-none pb-0.5"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p
              className={`text-sm font-semibold truncate ${
                ing.consumed ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {ing.nome}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">{ing.quantita_stimata}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onSaveEdit(index); }}
                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onCancelEdit(); }}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : ing.consumed ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleConsumed(index); }}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Ripristina"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onStartEdit(index, ing.nome); }}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Swipe hint label */}
      {swipeHint && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white/70 pointer-events-none">
          {swipeHint}
        </div>
      )}
    </div>
  );
}

export default function IngredientiPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const {
    items: ingredients, updateItem: updateIngredient, removeItem: removeIngredient,
    toggleConsumed, addManual,
  } = usePantryStore();
  const { setDishes, setStep, addCost } = useCookingStore();
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [filter, setFilter] = useState<"tutti" | "disponibili" | "esauriti">("tutti");
  const [newItem, setNewItem] = useState("");

  function startEdit(index: number, nome: string) {
    setEditingIndex(index);
    setEditValue(nome);
  }

  function saveEdit(index: number) {
    if (editValue.trim()) updateIngredient(index, { ...ingredients[index], nome: editValue.trim() });
    setEditingIndex(null);
  }

  function addNew() {
    const ok = addManual(newItem);
    if (!ok) {
      toast.error(newItem.trim() ? "Già in dispensa" : "Scrivi un ingrediente");
      return;
    }
    setNewItem("");
  }

  const available = ingredients.filter((i) => !i.consumed);
  const consumed = ingredients.filter((i) => i.consumed);

  const displayed = filter === "disponibili" ? available : filter === "esauriti" ? consumed : ingredients;

  const byCategory = displayed.reduce<Record<string, DetectedIngredient[]>>((acc, ing) => {
    const cat = ing.categoria ?? "altro";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ing);
    return acc;
  }, {});

  async function generateDishes() {
    if (available.length === 0) {
      toast.error("Nessun ingrediente disponibile. Ripristina qualcosa dalla dispensa.");
      return;
    }
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ingredients: available }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Errore"); return; }
      if (data.tokenUsage?.costEur) addCost(data.tokenUsage.costEur);
      setDishes(data.dishes);
      setStep("piatti");
      router.push("/piatti");
    } catch {
      toast.error("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          🏪 La tua dispensa
        </h1>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
            {available.length} disponibili
          </span>
          {consumed.length > 0 && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
              {consumed.length} esauriti
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {(["tutti", "disponibili", "esauriti"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
              filter === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "tutti" ? "Tutti" : f === "disponibili" ? "Disponibili" : "Esauriti"}
          </button>
        ))}
      </div>

      {/* Manual add */}
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNew()}
          placeholder="Aggiungi un ingrediente alla dispensa..."
          className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={addNew}
          className="w-11 h-11 chef-gradient rounded-xl flex items-center justify-center flex-shrink-0"
          aria-label="Aggiungi"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Hint */}
      {ingredients.length > 0 && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span>←</span> Scorri un ingrediente per segnarlo esaurito
        </p>
      )}

      {/* Ingredient list by category */}
      <div className="space-y-5">
        {categoryOrder
          .filter((cat) => byCategory[cat]?.length > 0)
          .map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{ingredientCategoryIcon(cat)}</span>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {categoryLabel[cat]}
                </h2>
              </div>
              {byCategory[cat].map((ing) => {
                const index = ingredients.indexOf(ing);
                return (
                  <PantryItem
                    key={index}
                    ing={ing}
                    index={index}
                    editingIndex={editingIndex}
                    editValue={editValue}
                    onStartEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingIndex(null)}
                    onSetEditValue={setEditValue}
                    onRemove={removeIngredient}
                    onToggleConsumed={toggleConsumed}
                  />
                );
              })}
            </div>
          ))}

        {displayed.length === 0 && ingredients.length > 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {filter === "esauriti" ? "Nessun ingrediente esaurito." : "Nessun ingrediente."}
          </div>
        )}

        {ingredients.length === 0 && (
          <Link
            href="/cucina"
            className="food-card p-6 flex flex-col items-center gap-2 text-center hover:border-primary/40 transition-all"
          >
            <div className="w-12 h-12 chef-gradient rounded-2xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <p className="font-semibold text-foreground">La dispensa è vuota</p>
            <p className="text-xs text-muted-foreground">
              Fotografa il frigo o aggiungi gli ingredienti a mano qui sopra
            </p>
          </Link>
        )}
      </div>

      {/* CTA */}
      {ingredients.length > 0 && (
        <button
          onClick={generateDishes}
          disabled={loading || available.length === 0}
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
              Proponi piatti con {available.length} ingredienti
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
