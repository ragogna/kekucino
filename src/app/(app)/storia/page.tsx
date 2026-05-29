"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Trash2, ChefHat, BookOpen, Heart, Filter } from "lucide-react";
import { formatTime, categoryColor } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface HistoryItem {
  id: string;
  dish: { nome: string; emoji: string; categoria: string };
  timing: string;
  recipe: { titolo: string; tempo_totale_min: number; difficolta: number };
  createdAt: { seconds: number };
  isFavorite?: boolean;
}

export default function StoriaPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFavOnly, setShowFavOnly] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  async function loadHistory() {
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "recipes"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HistoryItem)));
    } catch {
      toast.error("Errore nel caricamento della storia");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "recipes", id));
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Ricetta rimossa");
    } catch {
      toast.error("Errore nella rimozione");
    }
  }

  async function toggleFavorite(id: string, current: boolean) {
    if (!user) return;
    const newVal = !current;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isFavorite: newVal } : i));
    try {
      await updateDoc(doc(db, "users", user.uid, "recipes", id), { isFavorite: newVal });
      toast.success(newVal ? "Aggiunta ai preferiti ❤️" : "Rimossa dai preferiti");
    } catch {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, isFavorite: current } : i));
      toast.error("Errore");
    }
  }

  const displayed = showFavOnly ? items.filter((i) => i.isFavorite) : items;
  const timingLabel: Record<string, string> = {
    veloce: "⚡ Veloce",
    media: "🕐 Media",
    lunga: "👨‍🍳 Elaborata",
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton rounded-2xl h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Le mie ricette
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length === 0 ? "Nessuna ricetta salvata" : `${items.length} ricette · ${items.filter(i => i.isFavorite).length} preferite`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => setShowFavOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              showFavOnly
                ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20"
                : "food-card text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart className={`w-4 h-4 ${showFavOnly ? "fill-red-500 text-red-500" : ""}`} />
            Preferiti
          </button>
        )}
      </div>

      {displayed.length === 0 && showFavOnly ? (
        <div className="flex flex-col items-center py-8 gap-3 text-center">
          <Heart className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nessuna ricetta nei preferiti ancora.</p>
          <button onClick={() => setShowFavOnly(false)} className="text-primary text-sm font-medium">
            Mostra tutte
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-4 text-center">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Nessuna ricetta ancora</p>
            <p className="text-sm text-muted-foreground mt-1">
              Prepara e salva la tua prima ricetta!
            </p>
          </div>
          <Link
            href="/cucina"
            className="chef-gradient text-white px-6 py-3 rounded-xl font-semibold text-sm"
          >
            Inizia a cucinare
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((item) => (
            <div key={item.id} className={`food-card p-4 ${item.isFavorite ? "border-red-200 dark:border-red-800" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{item.dish.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-semibold text-foreground text-sm truncate">{item.recipe.titolo}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColor(item.dish.categoria)}`}>
                      {item.dish.categoria.replace("_", " ")}
                    </span>
                    {item.isFavorite && (
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(item.recipe.tempo_totale_min ?? 0)}
                    </span>
                    <span>{timingLabel[item.timing] ?? item.timing}</span>
                    {item.createdAt?.seconds && (
                      <span>
                        {new Date(item.createdAt.seconds * 1000).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleFavorite(item.id, !!item.isFavorite)}
                    className={`p-2 rounded-xl transition-colors ${
                      item.isFavorite
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        : "text-muted-foreground hover:text-red-400 hover:bg-red-50"
                    }`}
                    aria-label={item.isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                  >
                    <Heart className={`w-4 h-4 ${item.isFavorite ? "fill-red-500" : ""}`} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
