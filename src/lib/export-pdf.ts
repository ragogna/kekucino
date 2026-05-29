import { jsPDF } from "jspdf";
import { Recipe, DishProposal, TimingVariant } from "@/types";
import { formatTime, difficultyLabel } from "./utils";

const AMBER = [217, 119, 6] as const;
const DARK = [28, 25, 23] as const;
const GRAY = [120, 113, 108] as const;
const LIGHT_BG = [250, 249, 247] as const;

export function exportRecipePDF(dish: DishProposal, timing: TimingVariant, recipe: Recipe) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const MARGIN = 16;
  const COL = W - MARGIN * 2;
  let y = 0;

  function setFont(size: number, style: "normal" | "bold" | "italic" = "normal") {
    pdf.setFontSize(size);
    pdf.setFont("helvetica", style);
  }

  function colorText(r: number, g: number, b: number) {
    pdf.setTextColor(r, g, b);
  }

  function addText(text: string, x: number, yPos: number, opts?: { maxWidth?: number; align?: "left" | "center" | "right" }) {
    pdf.text(text, x, yPos, { maxWidth: opts?.maxWidth, align: opts?.align });
    return yPos;
  }

  function checkPage(needed = 10) {
    if (y + needed > 275) {
      pdf.addPage();
      y = 20;
      drawHeaderBar();
    }
  }

  function drawHeaderBar() {
    pdf.setFillColor(...AMBER);
    pdf.rect(0, 0, W, 8, "F");
    setFont(6, "bold");
    colorText(255, 255, 255);
    pdf.text("KeKucino — Il tuo chef stellato", MARGIN, 5.5);
    pdf.text(`${dish.nome}`, W - MARGIN, 5.5, { align: "right" });
  }

  // Page 1 header
  pdf.setFillColor(...AMBER);
  pdf.rect(0, 0, W, 45, "F");

  // Title block
  setFont(22, "bold");
  colorText(255, 255, 255);
  pdf.text(recipe.titolo, MARGIN, 20);

  setFont(10, "italic");
  colorText(255, 255, 255);
  const subtitleLines = pdf.splitTextToSize(dish.descrizione, COL);
  pdf.text(subtitleLines, MARGIN, 28);

  setFont(8);
  colorText(255, 255, 255);
  const timingLabels = { veloce: "⚡ Versione Veloce", media: "🕐 Versione Media (Consigliata)", lunga: "👨‍🍳 Versione Elaborata" };
  pdf.text(timingLabels[timing], MARGIN, 38);
  pdf.text(`${formatTime(recipe.tempo_totale_min)} · ${recipe.porzioni} persone · ${difficultyLabel(recipe.difficolta)}`, W - MARGIN, 38, { align: "right" });

  y = 55;

  // Chef intro
  pdf.setFillColor(...LIGHT_BG);
  pdf.roundedRect(MARGIN, y, COL, 18, 3, 3, "F");
  setFont(8, "italic");
  colorText(...GRAY);
  const introLines = pdf.splitTextToSize(`"${recipe.intro_chef}"`, COL - 8);
  pdf.text(introLines.slice(0, 3), MARGIN + 4, y + 6);
  y += 24;

  // Meta pills row
  const metaItems = [
    { label: "Tempo", value: formatTime(recipe.tempo_totale_min) },
    { label: "Porzioni", value: `${recipe.porzioni} pers.` },
    { label: "Difficoltà", value: difficultyLabel(recipe.difficolta) },
    { label: "Passaggi", value: `${recipe.passi.length}` },
  ];
  const pillW = COL / metaItems.length - 2;
  metaItems.forEach((item, i) => {
    const px = MARGIN + i * (pillW + 2.5);
    pdf.setFillColor(245, 240, 232);
    pdf.roundedRect(px, y, pillW, 12, 2, 2, "F");
    setFont(6, "bold");
    colorText(...AMBER);
    pdf.text(item.value, px + pillW / 2, y + 5.5, { align: "center" });
    setFont(5.5);
    colorText(...GRAY);
    pdf.text(item.label, px + pillW / 2, y + 9.5, { align: "center" });
  });
  y += 18;

  // Attrezzatura
  if (recipe.attrezzatura?.length > 0) {
    setFont(9, "bold");
    colorText(...DARK);
    pdf.text("Attrezzatura", MARGIN, y);
    y += 5;
    setFont(8);
    colorText(...GRAY);
    const attStr = recipe.attrezzatura.join(" · ");
    const attLines = pdf.splitTextToSize(attStr, COL);
    pdf.text(attLines, MARGIN, y);
    y += attLines.length * 4.5 + 5;
  }

  // Separator
  pdf.setDrawColor(...AMBER);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, y, W - MARGIN, y);
  y += 6;

  // Ingredients
  setFont(11, "bold");
  colorText(...AMBER);
  pdf.text("Ingredienti", MARGIN, y);
  y += 7;

  recipe.ingredienti.forEach((ing, i) => {
    checkPage(8);
    pdf.setFillColor(i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 247 : 255);
    pdf.rect(MARGIN, y - 4, COL, 7, "F");

    setFont(8, "bold");
    colorText(...DARK);
    pdf.text(ing.nome + (ing.opzionale ? " (opz.)" : ""), MARGIN + 3, y);

    setFont(8, "bold");
    colorText(...AMBER);
    pdf.text(`${ing.quantita} ${ing.unita}`, W - MARGIN - 3, y, { align: "right" });

    if (ing.note) {
      setFont(6.5, "italic");
      colorText(...GRAY);
      pdf.text(ing.note, MARGIN + 3, y + 3.5);
    }

    y += ing.note ? 8 : 6.5;
  });

  y += 4;

  // Separator
  pdf.setDrawColor(...AMBER);
  pdf.line(MARGIN, y, W - MARGIN, y);
  y += 6;

  // Steps
  setFont(11, "bold");
  colorText(...AMBER);
  pdf.text("Procedimento", MARGIN, y);
  y += 7;

  recipe.passi.forEach((step) => {
    // Estimate height needed
    const instrLines = pdf.splitTextToSize(step.istruzione, COL - 10);
    const height = 14 + instrLines.length * 4.5 + (step.trucco_chef ? 10 : 0) + (step.attenzione ? 8 : 0);
    checkPage(height + 6);

    // Step number bubble
    pdf.setFillColor(...AMBER);
    pdf.circle(MARGIN + 4, y, 4, "F");
    setFont(8, "bold");
    colorText(255, 255, 255);
    pdf.text(String(step.numero), MARGIN + 4, y + 1.2, { align: "center" });

    // Step title + time
    setFont(9, "bold");
    colorText(...DARK);
    pdf.text(step.titolo, MARGIN + 11, y - 1);
    setFont(7);
    colorText(...GRAY);
    if (step.tempo_min > 0) pdf.text(`${step.tempo_min} min`, W - MARGIN, y - 1, { align: "right" });
    if (step.temperatura) pdf.text(`🌡 ${step.temperatura}`, W - MARGIN - 20, y - 1, { align: "right" });

    // Instruction
    setFont(8);
    colorText(...DARK);
    pdf.text(instrLines, MARGIN + 11, y + 4);
    y += 6 + instrLines.length * 4.5;

    // Trucco chef
    if (step.trucco_chef) {
      pdf.setFillColor(254, 243, 199);
      const trickyLines = pdf.splitTextToSize(`💡 ${step.trucco_chef}`, COL - 14);
      pdf.roundedRect(MARGIN + 10, y, COL - 10, trickyLines.length * 4 + 5, 2, 2, "F");
      setFont(7, "italic");
      colorText(146, 64, 14);
      pdf.text(trickyLines, MARGIN + 13, y + 4);
      y += trickyLines.length * 4 + 8;
    }

    // Attenzione
    if (step.attenzione) {
      pdf.setFillColor(254, 226, 226);
      const warnLines = pdf.splitTextToSize(`⚠ ${step.attenzione}`, COL - 14);
      pdf.roundedRect(MARGIN + 10, y, COL - 10, warnLines.length * 4 + 5, 2, 2, "F");
      setFont(7);
      colorText(185, 28, 28);
      pdf.text(warnLines, MARGIN + 13, y + 4);
      y += warnLines.length * 4 + 8;
    }

    y += 4;
  });

  // Impiattamento
  if (recipe.impiattamento) {
    checkPage(20);
    pdf.setFillColor(245, 240, 232);
    const impLines = pdf.splitTextToSize(recipe.impiattamento, COL - 8);
    pdf.roundedRect(MARGIN, y, COL, impLines.length * 4.5 + 10, 3, 3, "F");
    pdf.setDrawColor(...AMBER);
    pdf.setLineWidth(1);
    pdf.line(MARGIN, y, MARGIN, y + impLines.length * 4.5 + 10);
    setFont(8, "bold");
    colorText(...AMBER);
    pdf.text("✨ Impiattamento", MARGIN + 4, y + 5);
    setFont(8, "italic");
    colorText(...DARK);
    pdf.text(impLines, MARGIN + 4, y + 10);
    y += impLines.length * 4.5 + 15;
  }

  // Consiglio finale
  if (recipe.consiglio_finale) {
    checkPage(20);
    pdf.setFillColor(...AMBER);
    const tipLines = pdf.splitTextToSize(recipe.consiglio_finale, COL - 8);
    pdf.roundedRect(MARGIN, y, COL, tipLines.length * 4.5 + 12, 3, 3, "F");
    setFont(8, "bold");
    colorText(255, 255, 255);
    pdf.text("Il segreto del chef", MARGIN + 4, y + 6);
    setFont(8, "italic");
    colorText(255, 255, 255);
    pdf.text(tipLines, MARGIN + 4, y + 11);
    y += tipLines.length * 4.5 + 17;
  }

  // Wine + varianti
  if (recipe.abbinamento_vino) {
    checkPage(15);
    setFont(8, "bold");
    colorText(...DARK);
    pdf.text("🍷 Abbinamento vino:", MARGIN, y);
    setFont(8);
    colorText(...GRAY);
    const wineLines = pdf.splitTextToSize(recipe.abbinamento_vino, COL - 30);
    pdf.text(wineLines, MARGIN + 32, y);
    y += Math.max(6, wineLines.length * 4.5) + 4;
  }

  if (recipe.varianti) {
    checkPage(15);
    setFont(8, "bold");
    colorText(...DARK);
    pdf.text("🌿 Varianti:", MARGIN, y);
    setFont(8);
    colorText(...GRAY);
    const varLines = pdf.splitTextToSize(recipe.varianti, COL - 20);
    pdf.text(varLines, MARGIN + 22, y);
    y += Math.max(6, varLines.length * 4.5) + 4;
  }

  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFillColor(245, 240, 232);
    pdf.rect(0, 287, W, 10, "F");
    setFont(6);
    colorText(...GRAY);
    pdf.text("KeKucino — Ricetta generata con AI · Buon appetito! 👨‍🍳", MARGIN, 293);
    pdf.text(`Pagina ${p} di ${totalPages}`, W - MARGIN, 293, { align: "right" });
  }

  const safeName = recipe.titolo.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 40);
  pdf.save(`KeKucino_${safeName}.pdf`);
}
