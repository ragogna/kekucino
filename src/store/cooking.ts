import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DishProposal, Recipe, RecipeMode } from "@/types";

interface CookingState {
  photos: string[];
  dishes: DishProposal[];
  selectedDish: DishProposal | null;
  selectedMode: RecipeMode;
  porzioni: number;
  recipe: Recipe | null;
  step: "foto" | "ingredienti" | "piatti" | "ricetta";
  totalCost: number;
}

interface CookingActions {
  setPhotos: (photos: string[]) => void;
  addPhoto: (photo: string) => void;
  removePhoto: (index: number) => void;
  setDishes: (dishes: DishProposal[]) => void;
  selectDish: (dish: DishProposal) => void;
  setSelectedMode: (mode: RecipeMode) => void;
  setPorzioni: (porzioni: number) => void;
  setRecipe: (recipe: Recipe) => void;
  setStep: (step: CookingState["step"]) => void;
  addCost: (cost: number) => void;
  reset: () => void;
}

const initialState: CookingState = {
  photos: [],
  dishes: [],
  selectedDish: null,
  selectedMode: "tradizionale",
  porzioni: 2,
  recipe: null,
  step: "foto",
  totalCost: 0,
};

export const useCookingStore = create<CookingState & CookingActions>()(
  persist(
    (set) => ({
      ...initialState,
      setPhotos: (photos) => set({ photos }),
      addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),
      removePhoto: (index) =>
        set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),
      setDishes: (dishes) => set({ dishes }),
      selectDish: (dish) => set({ selectedDish: dish }),
      setSelectedMode: (selectedMode) => set({ selectedMode }),
      setPorzioni: (porzioni) => set({ porzioni: Math.max(1, Math.min(12, porzioni)) }),
      setRecipe: (recipe) => set({ recipe }),
      setStep: (step) => set({ step }),
      addCost: (cost) => set((s) => ({ totalCost: parseFloat((s.totalCost + cost).toFixed(6)) })),
      reset: () => set(initialState),
    }),
    {
      name: "kekucino-session",
      partialize: (state) => ({
        // photos intentionally excluded — too large for localStorage
        dishes: state.dishes,
        selectedDish: state.selectedDish,
        selectedMode: state.selectedMode,
        porzioni: state.porzioni,
        recipe: state.recipe,
        step: state.step,
        totalCost: state.totalCost,
      }),
    }
  )
);
