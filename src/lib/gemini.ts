import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export function getGeminiModel(modelName = "gemini-2.0-flash") {
  return genAI.getGenerativeModel({ model: modelName, safetySettings });
}

export const PROMPTS = {
  analyzePhotos: `Sei un esperto culinario e nutrizionista con occhio infallibile. Analizza attentamente queste fotografie.

Identifica TUTTI gli alimenti visibili: frutta, verdura, carni, pesce, formaggi, salumi, uova, condimenti, spezie, prodotti in scatola, bottiglie, buste e qualsiasi altro alimento.

Sii esaustivo: anche i condimenti in fondo al frigo contano. Guarda attentamente ogni angolo.

Rispondi ESCLUSIVAMENTE con un JSON array valido, senza markdown o testo aggiuntivo:
[
  {
    "nome": "nome italiano dell'alimento",
    "quantita_stimata": "es: 3 pezzi, circa 200g, 1 bottiglia parziale",
    "categoria": "proteina",
    "confidenza": 0.95
  }
]

Categorie valide: "proteina", "verdura", "frutta", "latticini", "carboidrato", "condimento", "spezia", "altro"`,

  proposeDishes: (ingredients: string) => `Sei un cuoco stellato Michelin con 30 anni di esperienza nei migliori ristoranti italiani ed europei.

Ingredienti disponibili: ${ingredients}

Proponi esattamente 5 piatti DIVERSI e CREATIVI, dalle preparazioni più semplici alle più elaborate. Pensa come un grande chef: valorizza gli ingredienti, crea abbinamenti sorprendenti, proponi tecniche che elevino il risultato.

Per ogni piatto stima TRE varianti di tempo: veloce (max 20 min), media (20-45 min), lunga (45+ min).

Rispondi ESCLUSIVAMENTE con un JSON array valido, senza markdown o testo aggiuntivo:
[
  {
    "id": "piatto-1",
    "nome": "Nome evocativo del piatto",
    "descrizione": "1-2 frasi seducenti come in un menu stellato",
    "difficolta": 2,
    "tempo_veloce_min": 15,
    "tempo_medio_min": 30,
    "tempo_lungo_min": 60,
    "ingredienti_principali": ["ingrediente1", "ingrediente2"],
    "ingredienti_mancanti": [],
    "categoria": "primo",
    "wow_factor": "cosa rende speciale questo piatto",
    "emoji": "🍝"
  }
]

Categorie valide: "primo", "secondo", "contorno", "dolce", "aperitivo", "piatto_unico"`,

  getRecipe: (dishName: string, timing: string, timeMinutes: number, ingredients: string) =>
    `Sei un cuoco stellato Michelin. Crea la ricetta INFALLIBILE e PRECISA per: ${dishName}
Variante: ${timing} (circa ${timeMinutes} minuti)
Ingredienti disponibili: ${ingredients}

REGOLE ASSOLUTE:
1. Tutte le quantità in GRAMMI o ml (eccetto sale e pepe che possono avere "q.b.")
2. Le istruzioni devono essere così precise che anche un principiante non possa sbagliare
3. Indica il tempo esatto per ogni passaggio
4. Aggiungi trucchi da chef professionista e avvertenze sugli errori comuni
5. La ricetta DEVE riuscire se seguita con precisione

Rispondi ESCLUSIVAMENTE con un JSON valido, senza markdown o testo aggiuntivo:
{
  "titolo": "nome elegante e poetico del piatto",
  "intro_chef": "2-3 frasi appassionate che introducono il piatto come farebbe un grande chef",
  "porzioni": 2,
  "tempo_totale_min": ${timeMinutes},
  "difficolta": 3,
  "ingredienti": [
    {
      "nome": "nome ingrediente",
      "quantita": 200,
      "unita": "g",
      "note": "es: a temperatura ambiente",
      "opzionale": false
    }
  ],
  "attrezzatura": ["padella antiaderente 28cm", "coltello da chef"],
  "passi": [
    {
      "numero": 1,
      "titolo": "Titolo breve del passo",
      "istruzione": "Istruzione dettagliatissima. Nulla di sottinteso. Spiega come si vede quando è pronto.",
      "tempo_min": 5,
      "temperatura": "180°C",
      "trucco_chef": "Il segreto professionale per questo passaggio",
      "attenzione": "Errore comune da evitare assolutamente"
    }
  ],
  "impiattamento": "Descrizione poetica e precisa di come presentare il piatto per effetto wow",
  "consiglio_finale": "Il tocco del maestro che trasforma il piatto",
  "abbinamento_vino": "Vino specifico consigliato e il motivo dell'abbinamento",
  "varianti": "Come adattare per vegetariani, intolleranze o preferenze diverse"
}`,
};
