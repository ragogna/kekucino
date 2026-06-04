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
  tempo_min: number;
  ingredienti_principali: string[];
  ingredienti_mancanti: string[];
  categoria: "primo" | "secondo" | "contorno" | "dolce" | "aperitivo" | "piatto_unico";
  wow_factor: string;
  emoji: string;
  /** true quando il piatto è riadattato alla dispensa e non è la ricetta originale */
  adattato?: boolean;
  /** spiega come differisce dall'originale (sostituzioni, ingredienti mancanti) */
  nota_adattamento?: string;
}

export type RecipeMode = "tradizionale" | "stellato";

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
  /** presente quando la ricetta è riadattata alla dispensa: spiega le differenze dall'originale */
  nota_adattamento?: string;
}

export interface SavedRecipe {
  id: string;
  userId: string;
  dish: DishProposal;
  mode: RecipeMode;
  recipe: Recipe;
  photos: string[];
  createdAt: number;
  isFavorite?: boolean;
}
