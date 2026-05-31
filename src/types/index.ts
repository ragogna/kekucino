export interface DetectedIngredient {
  nome: string;
  quantita_stimata: string;
  categoria: "proteina" | "verdura" | "frutta" | "latticini" | "carboidrato" | "condimento" | "spezia" | "altro";
  confidenza: number;
  consumed?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  outputTokens: number;
  costEur: number;
}

export interface DishProposal {
  id: string;
  nome: string;
  descrizione: string;
  difficolta: number;
  tempo_veloce_min: number;
  tempo_medio_min: number;
  tempo_lungo_min: number;
  ingredienti_principali: string[];
  ingredienti_mancanti: string[];
  categoria: "primo" | "secondo" | "contorno" | "dolce" | "aperitivo" | "piatto_unico";
  wow_factor: string;
  emoji: string;
}

export type TimingVariant = "veloce" | "media" | "lunga";

export interface RecipeIngredient {
  nome: string;
  quantita: number;
  unita: string;
  note?: string;
  opzionale: boolean;
}

export interface RecipeStep {
  numero: number;
  titolo: string;
  istruzione: string;
  tempo_min: number;
  temperatura?: string;
  trucco_chef?: string;
  attenzione?: string;
}

export interface Recipe {
  titolo: string;
  intro_chef: string;
  porzioni: number;
  tempo_totale_min: number;
  difficolta: number;
  ingredienti: RecipeIngredient[];
  attrezzatura: string[];
  passi: RecipeStep[];
  impiattamento: string;
  consiglio_finale: string;
  abbinamento_vino?: string;
  varianti?: string;
}

export interface SavedRecipe {
  id: string;
  userId: string;
  dish: DishProposal;
  timing: TimingVariant;
  recipe: Recipe;
  photos: string[];
  createdAt: number;
  isFavorite?: boolean;
}
