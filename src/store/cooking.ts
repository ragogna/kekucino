import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DetectedIngredient, DishProposal, Recipe, TimingVariant } from "@/types";

interface CookingState {
  photos: string[];
  ingredients: DetectedIngredient[];
  dishes: DishProposal[];
  selectedDish: DishProposal | null;
  selectedTiming: TimingVariant;
  recipe: Recipe | null;
  step: "foto" | "ingredienti" | "piatti" | "ricetta";
  lastCallCost: number | null;
}

interface CookingActions {
  setPhotos: (photos: string[]) => void;
  addPhoto: (photo: string) => void;
  removePhoto: (index: number) => void;
  setIngredients: (ingredients: DetectedIngredient[]) => void;
  updateIngredient: (index: number, ingredient: DetectedIngredient) => void;
  removeIngredient: (index: number) => void;
  toggleConsumed: (index: number) => void;
  setDishes: (dishes: DishProposal[]) => void;
  selectDish: (dish: DishProposal) => void;
  setSelectedTiming: (timing: TimingVariant) => void;
  setRecipe: (recipe: Recipe) => void;
  setStep: (step: CookingState["step"]) => void;
  setLastCallCost: (cost: number) => void;
  reset: () => void;
}

const initialState: CookingState = {
  photos: [],
  ingredients: [],
  dishes: [],
  selectedDish: null,
  selectedTiming: "media",
  recipe: null,
  step: "foto",
  lastCallCost: null,
};

export const useCookingStore = create<CookingState & CookingActions>()(
  persist(
    (set) => ({
      ...initialState,
      setPhotos: (photos) => set({ photos }),
      addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),
      removePhoto: (index) =>
        set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),
      setIngredients: (ingredients) => set({ ingredients: Array.isArray(ingredients) ? ingredients : [] }),
      updateIngredient: (index, ingredient) =>
        set((s) => ({
          ingredients: s.ingredients.map((ing, i) => (i === index ? ingredient : ing)),
        })),
      removeIngredient: (index) =>
        set((s) => ({ ingredients: s.ingredients.filter((_, i) => i !== index) })),
      toggleConsumed: (index) =>
        set((s) => ({
          ingredients: s.ingredients.map((ing, i) =>
            i === index ? { ...ing, consumed: !ing.consumed } : ing
          ),
        })),
      setDishes: (dishes) => set({ dishes }),
      selectDish: (dish) => set({ selectedDish: dish }),
      setSelectedTiming: (selectedTiming) => set({ selectedTiming }),
      setRecipe: (recipe) => set({ recipe }),
      setStep: (step) => set({ step }),
      setLastCallCost: (cost) => set({ lastCallCost: cost }),
      reset: () => set(initialState),
    }),
    {
      name: "kekucino-session",
      partialize: (state) => ({
        // photos intentionally excluded — too large for localStorage
        ingredients: state.ingredients,
        dishes: state.dishes,
        selectedDish: state.selectedDish,
        selectedTiming: state.selectedTiming,
        recipe: state.recipe,
        step: state.step,
        // lastCallCost intentionally excluded — session only
      }),
    }
  )
);
