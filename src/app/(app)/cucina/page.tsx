"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Images, X, ChefHat, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCookingStore } from "@/store/cooking";
import { imageToBase64 } from "@/lib/utils";

const MAX_PHOTOS = 6;
const MAX_SIZE_MB = 5;

export default function CucinaPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { photos, addPhoto, removePhoto, setIngredients, setDishes, reset, setStep } = useCookingStore();
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: solo immagini`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: max ${MAX_SIZE_MB}MB`);
        continue;
      }
      const base64 = await imageToBase64(file);
      addPhoto(base64);
    }

    if (files.length > remaining) {
      toast.info(`Massimo ${MAX_PHOTOS} foto. Le eccedenti sono state ignorate.`);
    }
  }

  async function analyzePhotos() {
    if (photos.length === 0) {
      toast.error("Aggiungi almeno una foto!");
      return;
    }

    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photos }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Errore nell'analisi");
        return;
      }

      setIngredients(data.ingredients);
      setDishes([]);
      setStep("ingredienti");
      router.push("/ingredienti");
    } catch {
      toast.error("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    reset();
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Cosa cuciniamo?</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fotografa il tuo frigo o la dispensa
        </p>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <img
                src={`data:image/jpeg;base64,${photo}`}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                aria-label="Rimuovi foto"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => galleryRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Images className="w-5 h-5" />
              <span className="text-xs">Aggiungi</span>
            </button>
          )}
        </div>
      )}

      {/* Add photo buttons */}
      {photos.length === 0 && (
        <div className="space-y-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full food-card p-6 flex flex-col items-center gap-3 hover:border-primary/50 transition-all"
          >
            <div className="w-16 h-16 chef-gradient rounded-2xl flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Scatta una foto</p>
              <p className="text-xs text-muted-foreground mt-0.5">Usa la fotocamera</p>
            </div>
          </button>

          <button
            onClick={() => galleryRef.current?.click()}
            className="w-full food-card p-6 flex flex-col items-center gap-3 hover:border-primary/50 transition-all"
          >
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
              <Images className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Scegli dalla galleria</p>
              <p className="text-xs text-muted-foreground mt-0.5">Seleziona una o più foto</p>
            </div>
          </button>
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
            onClick={handleReset}
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
            Puoi aggiungere fino a {MAX_PHOTOS} foto: una del frigo aperto, una dei ripiani,
            una della dispensa... più foto = più ingredienti rilevati = ricette migliori!
          </p>
        </div>
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
