import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const APP_VERSION = "1.4.0";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCostEur(eur: number): string {
  if (!eur || eur <= 0) return "";
  if (eur < 0.0001) return "< €0.0001";
  if (eur < 0.001) return `€${eur.toFixed(5)}`;
  return `€${eur.toFixed(4)}`;
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function difficultyLabel(level: number): string {
  const labels = ["", "Facile", "Base", "Medio", "Avanzato", "Chef"];
  return labels[level] ?? "Medio";
}

export function categoryColor(categoria: string): string {
  const map: Record<string, string> = {
    primo: "bg-amber-100 text-amber-800",
    secondo: "bg-red-100 text-red-800",
    contorno: "bg-green-100 text-green-800",
    dolce: "bg-pink-100 text-pink-800",
    aperitivo: "bg-purple-100 text-purple-800",
    piatto_unico: "bg-blue-100 text-blue-800",
  };
  return map[categoria] ?? "bg-stone-100 text-stone-800";
}

export function ingredientCategoryIcon(categoria: string): string {
  const map: Record<string, string> = {
    proteina: "🥩",
    verdura: "🥦",
    frutta: "🍎",
    latticini: "🧀",
    carboidrato: "🌾",
    condimento: "🫙",
    spezia: "🌿",
    altro: "📦",
  };
  return map[categoria] ?? "📦";
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function compressImage(file: File, maxPx = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}
