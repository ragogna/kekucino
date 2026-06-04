"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Images, X, ChefHat, Sparkles, AlertCircle, Mic, Heart, ChevronLeft, ChevronRight, MessageCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useCookingStore } from "@/store/cooking";
import { usePantryStore } from "@/store/pantry";
import { db } from "@/lib/firebase";
import { compressImage } from "@/lib/utils";
import type { DetectedIngredient, DishProposal, Recipe, RecipeMode } from "@/types";

const MAX_PHOTOS = 20;
const MAX_SIZE_MB = 5;

interface FavoriteItem {
  id: string;
  dish: { id: string; nome: string; emoji: string; categoria: string; descrizione: string };
  mode?: RecipeMode;
  timing?: string; // fallback ricette vecchie
  recipe: Recipe;
  isFavorite: boolean;
}

export default function CucinaPage() {
  const router = useRouter();
  const { getIdToken, user } = useAuth();
  const {
    photos, addPhoto, removePhoto, setDishes,
    reset, setStep, setRecipe, selectDish, setSelectedMode, setPorzioni, addCost,
  } = useCookingStore();
  const addToPantry = usePantryStore((s) => s.addItems);
  const [loading, setLoading] = useState(false);
  const [scanIndex, setScanIndex] = useState(-1);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Voice
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "done">("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Favorites
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favIndex, setFavIndex] = useState(0);
  const [favLoaded, setFavLoaded] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: solo immagini`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: max ${MAX_SIZE_MB}MB`);
        continue;
      }
      const base64 = await compressImage(file);
      addPhoto(base64);
    }
  }

  function startScanAnimation() {
    setScanIndex(0);
    let i = 0;
    const interval = Math.max(800, Math.min(2000, 18000 / photos.length));
    scanTimerRef.current = setInterval(() => {
      i++;
      if (i < photos.length) setScanIndex(i);
      else clearInterval(scanTimerRef.current!);
    }, interval);
  }

  function stopScanAnimation() {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    setScanIndex(-1);
  }

  // Vercel limita il body delle richieste a ~4.5MB. base64 gonfia le foto del ~33%,
  // quindi spezziamo le foto in batch sotto soglia e le analizziamo in più chiamate.
  const MAX_BATCH_BYTES = 3.5 * 1024 * 1024;

  function buildBatches(list: string[]): string[][] {
    const batches: string[][] = [];
    let cur: string[] = [];
    let curSize = 0;
    for (const p of list) {
      const sz = (p.length * 3) / 4;
      if (cur.length > 0 && curSize + sz > MAX_BATCH_BYTES) {
        batches.push(cur);
        cur = [];
        curSize = 0;
      }
      cur.push(p);
      curSize += sz;
    }
    if (cur.length > 0) batches.push(cur);
    return batches;
  }

  async function analyzeBatch(batch: string[]): Promise<{ ingredients: DetectedIngredient[]; cost: number }> {
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      let res: Response;
      try {
        const token = await getIdToken();
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ photos: batch }),
        });
      } catch {
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        throw new Error("Errore di connessione. Controlla la rete e riprova.");
      }

      // 413: batch ancora troppo grande → dividilo a metà e riprova
      if (res.status === 413) {
        if (batch.length > 1) {
          const mid = Math.ceil(batch.length / 2);
          const a = await analyzeBatch(batch.slice(0, mid));
          const b = await analyzeBatch(batch.slice(mid));
          return { ingredients: [...a.ingredients, ...b.ingredients], cost: a.cost + b.cost };
        }
        throw new Error("Una foto è troppo grande. Riduci la qualità e riprova.");
      }

      if (!res.ok) {
        if (res.status >= 500 && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        let msg = "Errore nell'analisi";
        try { msg = (await res.json()).error ?? msg; } catch { msg = `Errore ${res.status}`; }
        throw new Error(msg);
      }

      const data = await res.json();
      return {
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        cost: data.tokenUsage?.costEur ?? 0,
      };
    }
    throw new Error("Analisi fallita");
  }

  async function analyzePhotos() {
    if (photos.length === 0) {
      toast.error("Aggiungi almeno una foto!");
      return;
    }
    setLoading(true);
    startScanAnimation();
    try {
      const batches = buildBatches(photos);
      let all: DetectedIngredient[] = [];
      let totalCost = 0;
      for (const batch of batches) {
        const r = await analyzeBatch(batch);
        all = all.concat(r.ingredients);
        totalCost += r.cost;
      }
      if (totalCost) addCost(totalCost);
      if (all.length === 0) {
        toast.error("Nessun ingrediente rilevato. Aggiungi foto più nitide o con più ingredienti.");
        return;
      }
      addToPantry(all);
      setDishes([]);
      setStep("ingredienti");
      toast.success(`${all.length} ingredienti aggiunti alla dispensa`);
      router.push("/ingredienti");
    } catch (err) {
      console.error("[analyze]", err);
      toast.error(err instanceof Error ? err.message : "Errore nell'analisi delle foto");
    } finally {
      stopScanAnimation();
      setLoading(false);
    }
  }

  // Voice input
  function startVoice() {
    const SR = typeof window !== "undefined"
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;
    if (!SR) {
      toast.error("Il tuo browser non supporta il riconoscimento vocale");
      return;
    }
    const recognition = new SR();
    recognition.lang = "it-IT";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setVoiceState("done");
    };
    recognition.onerror = () => {
      setVoiceState("idle");
      toast.error("Errore nel riconoscimento vocale. Riprova.");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setVoiceState("recording");
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setVoiceState("idle");
  }

  async function analyzeVoice() {
    if (!transcript) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: transcript }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Errore nell'analisi"); return; }
      if (data.tokenUsage?.costEur) addCost(data.tokenUsage.costEur);
      const voiceIngs = Array.isArray(data.ingredients) ? data.ingredients : [];
      addToPantry(voiceIngs);
      setDishes([]);
      setStep("ingredienti");
      toast.success(`${voiceIngs.length} ingredienti aggiunti alla dispensa`);
      router.push("/ingredienti");
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  // Favorites
  async function loadFavorites() {
    if (!user || favLoaded || favLoading) return;
    setFavLoading(true);
    try {
      const q = query(
        collection(db, "users", user.uid, "recipes"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FavoriteItem));
      const favs = all.filter((i) => i.isFavorite);
      const shuffled = [...favs].sort(() => Math.random() - 0.5);
      setFavorites(shuffled);
      setFavLoaded(true);
      setFavIndex(0);
    } catch {
      toast.error("Errore nel caricamento preferiti");
    } finally {
      setFavLoading(false);
    }
  }

  function openFavorite(fav: FavoriteItem) {
    const t = fav.recipe?.tempo_totale_min ?? 30;
    const fakeDish: DishProposal = {
      id: fav.dish.id ?? fav.id,
      nome: fav.dish.nome,
      descrizione: fav.dish.descrizione ?? "",
      difficolta: fav.recipe?.difficolta ?? 2,
      tempo_min: t,
      ingredienti_principali: fav.recipe?.ingredienti?.map((i: any) => i.nome).slice(0, 4) ?? [],
      ingredienti_mancanti: [],
      categoria: fav.dish.categoria as DishProposal["categoria"],
      wow_factor: "",
      emoji: fav.dish.emoji,
    };
    selectDish(fakeDish);
    setRecipe(fav.recipe);
    // ricetta già salvata: usa la modalità salvata (fallback tradizionale per le vecchie)
    setSelectedMode(fav.mode ?? "tradizionale");
    if (fav.recipe?.porzioni) setPorzioni(fav.recipe.porzioni);
    setStep("ricetta");
    router.push("/ricetta");
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Cosa cuciniamo?</h1>
        <p className="text-muted-foreground mt-1 text-sm">Fotografa il frigo, parla o chiedi allo chef</p>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => {
            const scanned = loading && scanIndex >= 0 && i < scanIndex;
            const scanning = loading && i === scanIndex;
            return (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                <img
                  src={`data:image/jpeg;base64,${photo}`}
                  alt={`Foto ${i + 1}`}
                  className={`w-full h-full object-cover transition-all duration-500 ${scanned ? "brightness-75" : ""}`}
                />
                {scanned && (
                  <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                )}
                {scanning && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                )}
                {!loading && (
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                    aria-label="Rimuovi foto"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={() => galleryRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Images className="w-5 h-5" />
            <span className="text-xs">Aggiungi</span>
          </button>
        </div>
      )}

      {/* Add photo buttons */}
      {photos.length === 0 && (
        <div className="space-y-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full food-card p-5 flex items-center gap-4 hover:border-primary/50 transition-all"
          >
            <div className="w-12 h-12 chef-gradient rounded-2xl flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Scatta una foto</p>
              <p className="text-xs text-muted-foreground mt-0.5">Usa la fotocamera</p>
            </div>
          </button>

          <button
            onClick={() => galleryRef.current?.click()}
            className="w-full food-card p-5 flex items-center gap-4 hover:border-primary/50 transition-all"
          >
            <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center flex-shrink-0">
              <Images className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Scegli dalla galleria</p>
              <p className="text-xs text-muted-foreground mt-0.5">Seleziona più foto insieme</p>
            </div>
          </button>

          {/* Voice input */}
          {voiceState === "idle" && (
            <button
              onClick={startVoice}
              className="w-full food-card p-5 flex items-center gap-4 hover:border-primary/50 transition-all"
            >
              <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center flex-shrink-0">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Descrivi a voce</p>
                <p className="text-xs text-muted-foreground mt-0.5">Elenca gli ingredienti parlando</p>
              </div>
            </button>
          )}

          {voiceState === "recording" && (
            <button
              onClick={stopVoice}
              className="w-full food-card p-5 flex items-center justify-center gap-3 border-red-300 bg-red-50 dark:bg-red-950/10"
            >
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-red-600 dark:text-red-400">Registrazione... tocca per fermare</span>
            </button>
          )}

          {voiceState === "done" && (
            <div className="food-card p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hai detto:</p>
              <p className="text-foreground font-medium">"{transcript}"</p>
              <div className="flex gap-2">
                <button
                  onClick={analyzeVoice}
                  disabled={loading}
                  className="flex-1 chef-gradient text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4" />
                  Analizza ingredienti
                </button>
                <button
                  onClick={() => { setVoiceState("idle"); setTranscript(""); }}
                  className="px-4 food-card rounded-xl flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Chat with chef */}
          <Link
            href="/chat"
            className="w-full food-card p-5 flex items-center gap-4 hover:border-primary/50 transition-all"
          >
            <div className="w-12 h-12 chef-gradient rounded-2xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Chiedi allo chef</p>
              <p className="text-xs text-muted-foreground mt-0.5">Descrivi cosa vuoi mangiare</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      )}

      {/* Action buttons when photos present */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex-1 food-card p-3 flex items-center justify-center gap-2 text-sm font-medium hover:border-primary/50 transition-all"
            >
              <Camera className="w-4 h-4 text-primary" />
              Scatta
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex-1 food-card p-3 flex items-center justify-center gap-2 text-sm font-medium hover:border-primary/50 transition-all"
            >
              <Images className="w-4 h-4 text-primary" />
              Galleria
            </button>
          </div>

          <button
            onClick={analyzePhotos}
            disabled={loading}
            className="w-full chef-gradient text-white rounded-2xl py-4 px-6 font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60 active:scale-98 transition-all"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Analizzando gli ingredienti...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analizza {photos.length} foto
              </>
            )}
          </button>

          <button
            onClick={() => reset()}
            className="w-full text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
          >
            Ricomincia da capo
          </button>
        </div>
      )}

      {/* Tip */}
      <div className="flex gap-3 bg-secondary rounded-2xl p-4">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Consiglio del chef</p>
          <p className="text-xs text-muted-foreground mt-1">
            Più foto = più ingredienti rilevati = ricette migliori. Fotografa frigo, ripiani e dispensa.
          </p>
        </div>
      </div>

      {/* Favorites */}
      {!favLoaded ? (
        <button
          onClick={loadFavorites}
          disabled={favLoading}
          className="w-full food-card p-4 flex items-center gap-4 hover:border-red-200 transition-all disabled:opacity-60"
        >
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            {favLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
            ) : (
              <Heart className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">Dai tuoi preferiti</p>
            <p className="text-xs text-muted-foreground mt-0.5">Riscopri le ricette che ami</p>
          </div>
        </button>
      ) : favorites.length === 0 ? (
        <div className="food-card p-4 flex items-center gap-3 text-muted-foreground">
          <Heart className="w-5 h-5" />
          <p className="text-sm">Aggiungi ricette ai preferiti per vederle qui</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              Dai tuoi preferiti
            </h2>
            <span className="text-xs text-muted-foreground">{favIndex + 1} / {favorites.length}</span>
          </div>

          <button
            onClick={() => openFavorite(favorites[favIndex])}
            className="w-full food-card p-4 text-left hover:border-red-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{favorites[favIndex].dish.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {favorites[favIndex].recipe?.titolo ?? favorites[favIndex].dish.nome}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {favorites[favIndex].dish.descrizione}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setFavIndex((i) => Math.max(0, i - 1))}
              disabled={favIndex === 0}
              className="flex-1 food-card py-2 flex items-center justify-center gap-1 text-sm text-muted-foreground disabled:opacity-30 hover:text-foreground transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Precedente
            </button>
            <button
              onClick={() => setFavIndex((i) => Math.min(favorites.length - 1, i + 1))}
              disabled={favIndex === favorites.length - 1}
              className="flex-1 food-card py-2 flex items-center justify-center gap-1 text-sm text-muted-foreground disabled:opacity-30 hover:text-foreground transition-all"
            >
              Successivo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
