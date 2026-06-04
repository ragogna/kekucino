import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DetectedIngredient } from "@/types";

interface PantryState {
  items: DetectedIngredient[];
}

interface PantryActions {
  /** Replace the whole pantry (used by the Firestore cross-device sync). */
  setItems: (items: DetectedIngredient[]) => void;
  /** Merge newly recognised ingredients into the pantry (dedup by name). */
  addItems: (items: DetectedIngredient[]) => void;
  /** Add a single ingredient typed by hand. Returns false if already present. */
  addManual: (nome: string, categoria?: DetectedIngredient["categoria"], quantita?: string) => boolean;
  updateItem: (index: number, item: DetectedIngredient) => void;
  removeItem: (index: number) => void;
  toggleConsumed: (index: number) => void;
  clear: () => void;
}

const norm = (s: string) => s.trim().toLowerCase();

export const usePantryStore = create<PantryState & PantryActions>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items: Array.isArray(items) ? items : [] }),
      addItems: (incoming) =>
        set((s) => {
          if (!Array.isArray(incoming)) return s;
          const merged = [...s.items];
          for (const item of incoming) {
            if (!item?.nome) continue;
            const i = merged.findIndex((m) => norm(m.nome) === norm(item.nome));
            if (i >= 0) {
              // re-detected → it's back in the pantry, refresh quantity
              merged[i] = { ...merged[i], quantita_stimata: item.quantita_stimata, consumed: false };
            } else {
              merged.push({ ...item, consumed: false });
            }
          }
          return { items: merged };
        }),
      addManual: (nome, categoria = "altro", quantita = "q.b.") => {
        let added = false;
        set((s) => {
          const clean = nome.trim();
          if (!clean) return s;
          if (s.items.some((m) => norm(m.nome) === norm(clean))) return s;
          added = true;
          return {
            items: [
              ...s.items,
              { nome: clean, quantita_stimata: quantita, categoria, confidenza: 1, consumed: false },
            ],
          };
        });
        return added;
      },
      updateItem: (index, item) =>
        set((s) => ({ items: s.items.map((it, i) => (i === index ? item : it)) })),
      removeItem: (index) => set((s) => ({ items: s.items.filter((_, i) => i !== index) })),
      toggleConsumed: (index) =>
        set((s) => ({
          items: s.items.map((it, i) => (i === index ? { ...it, consumed: !it.consumed } : it)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "kekucino-pantry" }
  )
);
